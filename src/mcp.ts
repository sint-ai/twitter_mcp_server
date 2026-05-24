import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { ResponseFormatter } from "./formatter.js";
import { TwitterClient } from "./twitter-api.js";
import { env } from "./configs/env.js";
import { searchTweetsWithXquik } from "./xquik-api.js";

function createTwitterClient(clientInfo: Record<string, string>): TwitterClient {
    if (!clientInfo?.oauth_token || !clientInfo?.oauth_token_secret) {
        throw new Error(`No twitter client for sessionId`);
    }
    if (!env.TWITTER_API_KEY || !env.TWITTER_API_SECRET) {
        throw new Error('TWITTER_API_KEY and TWITTER_API_SECRET are required for Twitter OAuth tools');
    }

    return new TwitterClient({
        appKey: env.TWITTER_API_KEY,
        appSecret: env.TWITTER_API_SECRET,
        accessToken: clientInfo.oauth_token.toString(),
        accessSecret: clientInfo.oauth_token_secret.toString()
    });
}

export const createMcp = () => {
    const mcp = new McpServer({
        name: 'twitter-mcp',
        version: '1.0.0'
    }, {
        capabilities: {
            tools: {}
        }
    });

    mcp.tool(
        'retweet',
        'Retweet a tweet on Twitter/X',
        {
            tweetId: z.string().describe('The ID of the tweet to retweet')
                .min(1, 'Tweet ID cannot be empty')
        },
        async (input, extra) => {
            try {
                const clientInfo = extra._meta?.client as Record<string, string>;
                const client = createTwitterClient(clientInfo);

                const res = await client.retweet(input.tweetId);
                return {
                    content: [
                        res.data.retweeted ? {
                            type: 'text',
                            text: `Tweet retweeted successfully!`
                        } : {
                            type: 'text',
                            text: `Failed to retweet tweet! Error: ${JSON.stringify(res.errors)}`
                        }
                    ] as TextContent[]
                };
            } catch (e: any) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error message: ${e.message}, Error data: ${e.data}`
                        }
                    ] as TextContent[]
                };
            }
        }
    )

    mcp.tool(
        'like_tweet',
        'Like a tweet on Twitter/X',
        {
            tweetId: z.string().describe('The ID of the tweet to like')
                .min(1, 'Tweet ID cannot be empty')
        },
        async (input, extra) => {
            try {
                const clientInfo = extra._meta?.client as Record<string, string>;
                const client = createTwitterClient(clientInfo);
                const res = await client.likeTweet(input.tweetId);
                return {
                    content: [
                        res.data.liked ? {
                            type: 'text',
                            text: `Tweet liked successfully!`
                        } : {
                            type: 'text',
                            text: `Failed to like tweet! Error: ${JSON.stringify(res.errors)}`
                        }
                    ] as TextContent[]
                };
            } catch (e: any) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error message: ${e.message}, Error data: ${e.data}`
                        }
                    ] as TextContent[]
                };
            }
        }
    )

    mcp.tool(
        'post_tweet',
        'Post a new tweet to Twitter/X',
        {
            text: z.string().describe('The content of your tweet')
                .min(1, 'Tweet text cannot be empty')
                .max(280, 'Tweet cannot exceed 280 characters'),
            images: z.array(
                z.string().describe('The URL of the image to upload')
                    .min(1, 'Image URL cannot be empty')
            )
                .max(4, 'Cannot have more than 4 images')
                .optional()
        },
        async (input, extra) => {
            try {
                const clientInfo = extra._meta?.client as Record<string, string>;
                const client = createTwitterClient(clientInfo);
                const tweet = await client.postTweet(input.text, input.images);
                const me = await client.getMe();

                return {
                    content: [{
                        type: 'text',
                        text: `Tweet posted successfully!\nURL: https://twitter.com/${me.username}/status/${tweet.id}`
                    }] as TextContent[]
                };
            } catch (e: any) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error message: ${e.message}, Error data: ${e.data}`
                        }
                    ] as TextContent[]
                };
            }
        }
    );

    mcp.tool(
        'search_tweets',
        'Search for tweets on Twitter/X',
        {
            query: z.string().describe('Search query').min(1, 'Search query cannot be empty'),
            count: z.number().describe('Number of tweets to retrieve').int('Count must be an integer').min(10, 'Minimum count is 10').max(100, 'Maximum count is 100'),
        },
        async (input, extra) => {
            try {
                const clientInfo = extra._meta?.client as Record<string, string>;
                const { tweets, users } = env.SEARCH_BACKEND === 'twitter'
                    ? await createTwitterClient(clientInfo).searchTweets(input.query, input.count)
                    : await searchTweetsWithXquik(input.query, input.count, {
                        apiKey: env.XQUIK_API_KEY ?? env.HERMES_TWEET_API_KEY,
                        authScheme: env.XQUIK_AUTH_SCHEME,
                        baseUrl: env.XQUIK_BASE_URL
                    });

                const formattedResponse = ResponseFormatter.formatSearchResponse(
                    input.query,
                    tweets,
                    users
                );

                return {
                    content: [
                        {
                            type: 'text',
                            text: ResponseFormatter.toMcpResponse(formattedResponse)
                        }
                    ] as TextContent[]
                };
            } catch (e: any) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error message: ${e.message}, Error data: ${e.data}`
                        }
                    ] as TextContent[]
                };
            }
        }
    )

    return mcp;
}
