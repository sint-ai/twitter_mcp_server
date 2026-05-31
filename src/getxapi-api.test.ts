import { describe, expect, it, vi } from 'vitest';
import { buildGetxapiSearchUrl, searchTweetsWithGetxapi } from './getxapi-api.js';

describe('getxapi-api.ts', () => {
    it('should build search URLs with custom base paths', () => {
        const url = new URL(buildGetxapiSearchUrl('ai agents', 25, 'https://example.test/proxy/'));

        expect(url.pathname).toBe('/proxy/twitter/tweet/advanced_search');
        expect(url.searchParams.get('q')).toBe('ai agents');
        expect(url.searchParams.get('limit')).toBe('25');
    });

    it('should normalize tweets and included users', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                data: {
                    tweets: [{
                        tweetId: '1',
                        full_text: 'GetXAPI result',
                        authorId: 'u1',
                        publicMetrics: {
                            like_count: '4',
                            retweet_count: 2
                        },
                        createdAt: '2026-05-24T17:00:00Z'
                    }],
                    includes: {
                        users: [{
                            id: 'u1',
                            username: 'getxapi_user'
                        }]
                    }
                }
            })
        });

        const result = await searchTweetsWithGetxapi('GetXAPI', 10, {
            apiKey: 'test-key',
            baseUrl: 'https://example.test',
            fetchImpl: fetchImpl as typeof fetch,
            timeoutMs: 1000
        });

        expect(result.tweets).toEqual([{
            id: '1',
            text: 'GetXAPI result',
            authorId: 'u1',
            metrics: {
                likes: 4,
                retweets: 2
            },
            createdAt: '2026-05-24T17:00:00Z'
        }]);
        expect(result.users).toEqual([{ id: 'u1', username: 'getxapi_user' }]);
        expect(fetchImpl).toHaveBeenCalledTimes(1);
        const [_url, options] = fetchImpl.mock.calls[0];
        expect((options as RequestInit).headers).toMatchObject({ Authorization: 'Bearer test-key' });
    });

    it('should fail before fetch when the API key is missing', async () => {
        const fetchImpl = vi.fn();

        await expect(searchTweetsWithGetxapi('GetXAPI', 10, {
            fetchImpl: fetchImpl as typeof fetch
        })).rejects.toThrow('GETXAPI_API_KEY or GETXAPI_KEY');
        expect(fetchImpl).not.toHaveBeenCalled();
    });
});
