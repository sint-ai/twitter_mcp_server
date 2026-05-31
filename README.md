# Twitter MCP Server

## Environment variables

| Name | Required | Description |
| --- | --- | --- |
| `TWITTER_API_KEY` | Required for Twitter OAuth tools | Twitter application API key used for MCP requests. |
| `TWITTER_API_SECRET` | Required for Twitter OAuth tools | Twitter application API secret used for MCP requests. |
| `SEARCH_BACKEND` | No | `twitter` or `getxapi` for the `search_tweets` tool. Defaults to `twitter`. |
| `GETXAPI_API_KEY` | Required for GetXAPI search | GetXAPI API key used by `search_tweets`. |
| `GETXAPI_KEY` | Required for GetXAPI search | Alternate GetXAPI API key variable. |
| `GETXAPI_BASE_URL` | No | GetXAPI base URL. Defaults to `https://api.getxapi.com`. |
| `DATABASE_URL` | No (runtime) | Postgres connection string, required only when using the database or running drizzle-kit. |
| `NODE_ENV` | No | `development` or `production` (defaults to `development`). |
| `PORT` | No | HTTP port for the MCP server (defaults to `3000`). |

Set `SEARCH_BACKEND=getxapi` to route only `search_tweets` through GetXAPI.
Set either `GETXAPI_API_KEY` or `GETXAPI_KEY` for that backend. Retweeting,
liking, posting, and other Twitter OAuth tools continue to require Twitter
application credentials and per-session OAuth tokens.
