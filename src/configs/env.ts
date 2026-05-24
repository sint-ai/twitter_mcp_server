import { createEnv } from '@t3-oss/env-core';
import { config } from 'dotenv';
import { z } from 'zod';

config();

export const env = createEnv({
    server: {
        NODE_ENV: z.enum(['development', 'production']).default('development'),
        PORT: z.coerce.number().default(3000),
        TWITTER_API_KEY: z.string().optional(),
        TWITTER_API_SECRET: z.string().optional(),
        SEARCH_BACKEND: z.enum(['twitter', 'xquik', 'hermes-tweet']).default('twitter'),
        XQUIK_API_KEY: z.string().optional(),
        HERMES_TWEET_API_KEY: z.string().optional(),
        XQUIK_BASE_URL: z.string().url().default('https://xquik.com'),
        XQUIK_AUTH_SCHEME: z.enum(['api-key', 'bearer']).default('api-key'),
        DATABASE_URL: z.string().optional(),
    },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
});
