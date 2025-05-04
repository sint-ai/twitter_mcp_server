​![tag : innovationlab](https://img.shields.io/badge/innovationlab-3D8BD3)

# Twitter MCP Server

A Model Context Protocol server for Twitter/X integration, enabling AI models to interact with the Twitter platform.

## Overview

Twitter MCP Server provides a set of tools for AI models to interact with Twitter through the [Model Context Protocol (MCP)](https://github.com/anthropics/anthropic-cookbook/tree/main/model_context_protocol) standard. This server enables posting tweets, retweeting, liking tweets, and searching for content on Twitter from AI applications.

## Features

- **Post Tweets**: Create new tweets with text content and optional images
- **Retweet**: Retweet existing tweets by ID
- **Like Tweets**: Like existing tweets by ID
- **Search Tweets**: Search Twitter for specific content with customizable result count

## Prerequisites

- Node.js v22.0.0 or higher
- Twitter Developer Account with API credentials
- OAuth tokens for Twitter API authentication

## Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/twitter-mcp-server.git
cd twitter-mcp-server
```

2. Install dependencies:

```bash
npm install
```

3. Copy the example environment file and populate it with your credentials:

```bash
cp .env.example .env
```

## Configuration

Edit the `.env` file with your Twitter API credentials:

```
PORT=3000
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
```

## Usage

### Start the server

```bash
npm start
```

The server will be available at `http://localhost:3000` (or your configured PORT).

### API Endpoints

- `POST /mcp`: Main MCP endpoint that handles all Twitter operations

### MCP Tools

The server provides the following MCP tools:

#### post_tweet

Posts a new tweet on Twitter.

**Parameters:**
- `text` (string): The content of your tweet (1-280 characters)
- `images` (string[], optional): Array of image URLs to attach (max 4 images)

#### retweet

Retweets an existing tweet.

**Parameters:**
- `tweetId` (string): The ID of the tweet to retweet

#### like_tweet

Likes an existing tweet.

**Parameters:**
- `tweetId` (string): The ID of the tweet to like

#### search_tweets

Searches for tweets on Twitter.

**Parameters:**
- `query` (string): Search query
- `count` (number): Number of tweets to retrieve (10-100)

## Development

Build the TypeScript source:

```bash
npm run build
```

Type checking:

```bash
npm run check-types
```