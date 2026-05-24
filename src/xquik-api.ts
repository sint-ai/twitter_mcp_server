import { Tweet, TwitterUser } from './types.js';

const SEARCH_PATH = '/api/v1/x/tweets/search';
const REQUEST_TIMEOUT_MS = 15000;

type FetchLike = typeof fetch;

export interface XquikSearchOptions {
    apiKey?: string;
    authScheme?: 'api-key' | 'bearer';
    baseUrl?: string;
    fetchImpl?: FetchLike;
    timeoutMs?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function numberValue(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
}

function pick(record: Record<string, unknown>, keys: string[]): unknown {
    for (const key of keys) {
        if (record[key] !== undefined && record[key] !== null) {
            return record[key];
        }
    }
    return undefined;
}

function findTweetArray(payload: unknown): unknown[] {
    if (Array.isArray(payload)) {
        return payload;
    }
    if (!isRecord(payload)) {
        return [];
    }

    for (const key of ['tweets', 'results', 'items', 'data', 'users']) {
        const value = payload[key];
        if (Array.isArray(value)) {
            return value;
        }
        const nested = findTweetArray(value);
        if (nested.length) {
            return nested;
        }
    }

    return [];
}

function normalizeMetrics(value: unknown): Tweet['metrics'] {
    const metrics = isRecord(value) ? value : {};
    return {
        likes: numberValue(metrics.like_count) ?? numberValue(metrics.likes) ?? 0,
        retweets: numberValue(metrics.retweet_count) ?? numberValue(metrics.retweets) ?? 0
    };
}

function normalizeTweet(raw: unknown): Tweet | null {
    if (!isRecord(raw)) {
        return null;
    }

    const id = stringValue(pick(raw, ['id', 'tweet_id', 'tweetId', 'rest_id']));
    const text = stringValue(pick(raw, ['text', 'full_text', 'content', 'body']));
    if (!id || !text) {
        return null;
    }

    return {
        id,
        text,
        authorId: stringValue(pick(raw, ['author_id', 'authorId', 'user_id', 'userId'])) ?? '',
        metrics: normalizeMetrics(pick(raw, ['public_metrics', 'publicMetrics', 'metrics'])),
        createdAt: stringValue(pick(raw, ['created_at', 'createdAt', 'time'])) ?? ''
    };
}

function normalizeUser(raw: unknown): TwitterUser | null {
    if (!isRecord(raw)) {
        return null;
    }

    const id = stringValue(pick(raw, ['id', 'user_id', 'userId', 'author_id', 'authorId']));
    const username = stringValue(pick(raw, ['username', 'screen_name', 'screenName', 'handle']));
    if (!id || !username) {
        return null;
    }

    return { id, username };
}

function extractUsers(payload: unknown, tweets: Tweet[]): TwitterUser[] {
    const usersById = new Map<string, TwitterUser>();

    const collectUsers = (value: unknown) => {
        if (Array.isArray(value)) {
            for (const rawUser of value) {
                const user = normalizeUser(rawUser);
                if (user) {
                    usersById.set(user.id, user);
                }
            }
            return;
        }
        if (!isRecord(value)) {
            return;
        }

        if (Array.isArray(value.users)) {
            collectUsers(value.users);
        }
        if (value.data) {
            collectUsers(value.data);
        }
        if (value.includes) {
            collectUsers(value.includes);
        }
        for (const rawTweet of findTweetArray(value)) {
            if (!isRecord(rawTweet)) {
                continue;
            }
            const user = normalizeUser(rawTweet.author ?? rawTweet.user);
            if (user) {
                usersById.set(user.id, user);
            }
        }
    };

    collectUsers(payload);

    return tweets.map((tweet) => {
        return usersById.get(tweet.authorId) ?? {
            id: tweet.authorId,
            username: tweet.authorId || 'unknown'
        };
    });
}

export function buildXquikSearchUrl(
    query: string,
    count: number,
    baseUrl = 'https://xquik.com'
): string {
    const url = new URL(baseUrl);
    const basePath = url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname;
    url.pathname = `${basePath === '/' ? '' : basePath}${SEARCH_PATH}`;
    url.searchParams.set('q', query);
    url.searchParams.set('limit', String(count));
    return url.toString();
}

function buildHeaders(apiKey: string, authScheme: 'api-key' | 'bearer'): Record<string, string> {
    return {
        Accept: 'application/json',
        ...(authScheme === 'bearer'
            ? { Authorization: `Bearer ${apiKey}` }
            : { 'x-api-key': apiKey })
    };
}

export async function searchTweetsWithXquik(
    query: string,
    count: number,
    options: XquikSearchOptions = {}
): Promise<{ tweets: Tweet[], users: TwitterUser[] }> {
    const apiKey = options.apiKey?.trim();
    if (!apiKey) {
        throw new Error('XQUIK_API_KEY or HERMES_TWEET_API_KEY is required when SEARCH_BACKEND=xquik');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? REQUEST_TIMEOUT_MS);
    let response: Response;
    try {
        response = await (options.fetchImpl ?? fetch)(
            buildXquikSearchUrl(query, count, options.baseUrl),
            {
                headers: buildHeaders(apiKey, options.authScheme ?? 'api-key'),
                signal: controller.signal
            }
        );
    } finally {
        clearTimeout(timeout);
    }

    if (!response.ok) {
        const body = await response.text().catch(() => '');
        const details = body.trim() ? `: ${body.trim().slice(0, 300)}` : '';
        throw new Error(`Xquik search failed with HTTP ${response.status}${details}`);
    }

    const payload = await response.json();
    const tweets = findTweetArray(payload)
        .map(normalizeTweet)
        .filter((tweet): tweet is Tweet => tweet !== null);

    return {
        tweets,
        users: extractUsers(payload, tweets)
    };
}
