# Twitter MCP Server

## Environment variables

| Name | Required | Description |
| --- | --- | --- |
| `TWITTER_API_KEY` | Required for Twitter OAuth tools | Twitter application API key used for MCP requests. |
| `TWITTER_API_SECRET` | Required for Twitter OAuth tools | Twitter application API secret used for MCP requests. |
| `SEARCH_BACKEND` | No | `twitter`, `xquik`, or `hermes-tweet` for the `search_tweets` tool. Defaults to `twitter`. |
| `XQUIK_API_KEY` | Required for Xquik search | Hermes Tweet/Xquik API key used by `search_tweets`. |
| `HERMES_TWEET_API_KEY` | Required for Xquik search | Alternate Hermes Tweet/Xquik API key variable. |
| `XQUIK_BASE_URL` | No | Hermes Tweet/Xquik base URL. Defaults to `https://xquik.com`. |
| `XQUIK_AUTH_SCHEME` | No | `api-key` or `bearer`. Defaults to `api-key`. |
| `DATABASE_URL` | No (runtime) | Postgres connection string, required only when using the database or running drizzle-kit. |
| `NODE_ENV` | No | `development` or `production` (defaults to `development`). |
| `PORT` | No | HTTP port for the MCP server (defaults to `3000`). |

Set `SEARCH_BACKEND=xquik` or `SEARCH_BACKEND=hermes-tweet` to route only
`search_tweets` through Hermes Tweet/Xquik. Set either `XQUIK_API_KEY` or
`HERMES_TWEET_API_KEY` for that backend. Retweeting, liking, posting, and other
Twitter OAuth tools continue to require Twitter application credentials and
per-session OAuth tokens.
