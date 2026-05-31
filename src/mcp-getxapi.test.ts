import { beforeEach, describe, expect, it, vi } from 'vitest';

const toolHandlers: Record<string, (input: any, extra: any) => Promise<any>> = {};

const mocks = vi.hoisted(() => {
    process.env.NODE_ENV = 'development';
    process.env.SEARCH_BACKEND = 'getxapi';
    process.env.GETXAPI_API_KEY = '';
    process.env.GETXAPI_KEY = 'test-getxapi-key';
    process.env.GETXAPI_BASE_URL = 'https://example.test';

    return {
        searchTweetsWithGetxapi: vi.fn(),
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

vi.mock('./getxapi-api.js', () => {
    return {
        searchTweetsWithGetxapi: mocks.searchTweetsWithGetxapi
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

describe('mcp.ts with GetXAPI search backend', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.keys(toolHandlers).forEach((key) => delete toolHandlers[key]);
        createMcp();
    });

    it('should search with GetXAPI without OAuth metadata', async () => {
        const tweets = [{
            id: '1',
            text: 'GetXAPI result',
            authorId: 'u1',
            metrics: { likes: 4, retweets: 2 },
            createdAt: '2026-05-24T17:00:00Z'
        }];
        const users = [{ id: 'u1', username: 'getxapi_user' }];
        mocks.searchTweetsWithGetxapi.mockResolvedValue({ tweets, users });

        const result = await toolHandlers['search_tweets']({ query: 'GetXAPI', count: 10 }, {});

        expect(mocks.twitterClient).not.toHaveBeenCalled();
        expect(mocks.searchTweetsWithGetxapi).toHaveBeenCalledWith('GetXAPI', 10, {
            apiKey: 'test-getxapi-key',
            baseUrl: 'https://example.test'
        });
        expect(ResponseFormatter.formatSearchResponse).toHaveBeenCalledWith('GetXAPI', tweets, users);
        expect(result.content[0].text).toBe('formatted response');
    });
});
