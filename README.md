# file-link-store-bot

Telegram file indexing bot for private channels.

Official bot name: **File Link Store Bot**.

This bot:
- Stores files posted in a configured channel.
- Generates deep links (`/start <linkId>`) to retrieve stored files.
- Supports user search with pagination (10 result buttons per page).
- Uses regex-based metadata extraction.

## How it works
1. You post files in your source Telegram channel.
2. Bot listens to `channel_post`, stores file info in MongoDB, and creates a `linkId`.
3. Users search with `/search <query>`.
4. Bot returns buttons that open deep links.
5. Opening deep link sends back original stored file(s).

## Requirements
- Node.js 20+
- MongoDB (local or cloud)
- Telegram bot token from `@BotFather`
- Bot username (without `@`)
- Telegram channel ID to index

## Quick start (local)

1. Clone and install:

```bash
git clone https://github.com/mithun-ctrl/ai-file-store-bot.git file-link-store-bot
cd file-link-store-bot
npm install
```

2. Create env file:

```bash
cp .env.example .env
```

3. Edit `.env` values.

4. Run:

```bash
npm run start
```

For development:

```bash
npm run dev
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `BOT_TOKEN` | Yes | Bot token from `@BotFather` |
| `BOT_USERNAME` | Yes | Bot username without `@` |
| `DB_URI` | Yes | MongoDB connection string |
| `DB_CHANNEL_ID` | Yes | Telegram channel ID to index (example: `-1001234567890`) |
| `HEALTH_HOST` | No | Health server bind host (default: `0.0.0.0`) |
| `PORT` | No | Health server port (default: `8080`) |

## Telegram setup checklist
1. Create bot with `@BotFather`.
2. Add bot to your source channel as admin.
3. Post a test file in that channel.
4. Make sure `DB_CHANNEL_ID` matches that channel.

Note: For private channels, if invite link looks like `https://t.me/c/1234567890/5`, use `-1001234567890` as `DB_CHANNEL_ID`.

## Bot commands
- `/search <query>`: search stored files and show paginated result buttons (10 per page).
- `/start <linkId>`: fetch file(s) for a generated deep link.

## Health endpoint
- Default health URL: `http://<server-ip>:<PORT>/`
- Returns JSON: `{ "status": "Bot is Running" }`
- Only `/` is exposed for health checks.

## Production VPS deployment
Detailed production steps are documented in:

- `docs/VPS_DEPLOYMENT.md`
- `docs/DOCKER_DEPLOYMENT.md`

It covers:
- Ubuntu server setup
- Node.js + MongoDB preparation
- systemd service setup
- logs, restart, and upgrade flow
- security basics
- Docker + Docker Compose deployment
