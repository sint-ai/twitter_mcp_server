import { beforeEach, describe, expect, it, vi } from 'vitest';

const toolHandlers: Record<string, (input: any, extra: any) => Promise<any>> = {};

const mocks = vi.hoisted(() => {
    process.env.NODE_ENV = 'development';
    process.env.SEARCH_BACKEND = 'xquik';
    process.env.XQUIK_API_KEY = '';
    process.env.HERMES_TWEET_API_KEY = 'test-hermes-key';
    process.env.XQUIK_BASE_URL = 'https://example.test';

    return {
        searchTweetsWithXquik: vi.fn(),
        twitterClient: vi.fn()
    };
});

vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => {
    return {
        McpServer: class MockMcpServer {
            constructor() {}
            tool(name: string, _description: string, _schema: any, handler: any) {
                toolHandlers[name] = handler;
            }
        },
    };
});

vi.mock('./xquik-api.js', () => {
    return {
        searchTweetsWithXquik: mocks.searchTweetsWithXquik
    };
});

vi.mock('./twitter-api.js', () => {
    return {
        TwitterClient: mocks.twitterClient
    };
});

vi.mock('./formatter.js', () => ({
    ResponseFormatter: {
        formatSearchResponse: vi.fn().mockReturnValue({ formatted: true }),
        toMcpResponse: vi.fn().mockReturnValue('formatted response'),
    },
}));

import { createMcp } from './mcp.js';
import { ResponseFormatter } from './formatter.js';

describe('mcp.ts with Xquik search backend', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.keys(toolHandlers).forEach((key) => delete toolHandlers[key]);
        createMcp();
    });

    it('should search with Xquik without OAuth metadata', async () => {
        const tweets = [{
            id: '1',
            text: 'Hermes Tweet result',
            authorId: 'u1',
            metrics: { likes: 4, retweets: 2 },
            createdAt: '2026-05-24T17:00:00Z'
        }];
        const users = [{ id: 'u1', username: 'hermes_user' }];
        mocks.searchTweetsWithXquik.mockResolvedValue({ tweets, users });

        const result = await toolHandlers['search_tweets']({ query: 'Hermes Tweet', count: 10 }, {});

        expect(mocks.twitterClient).not.toHaveBeenCalled();
        expect(mocks.searchTweetsWithXquik).toHaveBeenCalledWith('Hermes Tweet', 10, {
            apiKey: 'test-hermes-key',
            authScheme: 'api-key',
            baseUrl: 'https://example.test'
        });
        expect(ResponseFormatter.formatSearchResponse).toHaveBeenCalledWith('Hermes Tweet', tweets, users);
        expect(result.content[0].text).toBe('formatted response');
    });
});
