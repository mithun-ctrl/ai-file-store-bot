# Docker Deployment Guide

This guide explains how to run **File Link Store Bot** using Docker and Docker Compose.

## 1. Prerequisites
- Docker Engine 24+
- Docker Compose plugin (`docker compose`)
- A Telegram bot token from `@BotFather`
- Bot username and channel ID

Verify installation:

```bash
docker --version
docker compose version
```

## 2. Clone repository

```bash
git clone https://github.com/mithun-ctrl/ai-file-store-bot.git file-link-store-bot
cd file-link-store-bot
```

## 3. Configure environment for Docker

```bash
cp .env.docker.example .env
```

Edit `.env` and set:
- `BOT_TOKEN`
- `BOT_USERNAME` (without `@`)
- `DB_CHANNEL_ID`
- `HEALTH_PORT` (default `8080`)

Default Docker DB URI is already set:
- `DB_URI=mongodb://mongo:27017/file-link-store-bot`

## 4. Start containers

```bash
docker compose up -d --build
```

Containers:
- `file-link-store-mongo`: MongoDB with persistent volume `mongo_data`
- `file-link-store-bot`: Telegram bot service

Health endpoint (default):

```bash
curl -i http://127.0.0.1:8080/
```

Expected:
- `200` with JSON `{ "status": "Bot Running" }`.

## 5. Check logs and status

```bash
docker compose ps
docker compose logs -f bot
docker compose logs -f mongo
```

## 6. Stop / restart

```bash
docker compose stop
docker compose start
docker compose restart bot
```

To fully remove stack (keeps named volume by default):

```bash
docker compose down
```

Remove also DB data:

```bash
docker compose down -v
```

## 7. Update deployment

```bash
git pull origin main
docker compose up -d --build
docker compose logs -f bot
```

## 8. VPS usage with Docker
On a VPS, run the same commands from this guide.

Recommended:
- Use a dedicated user.
- Keep `.env` private.
- Enable firewall (`ufw`) and open only required ports.
- Do not expose MongoDB port publicly.
- Allow health port access only from your home IP if using remote monitoring.

## 9. Troubleshooting

Bot exits immediately:
- Validate `BOT_TOKEN`, `BOT_USERNAME`, `DB_CHANNEL_ID` in `.env`.
- Check logs: `docker compose logs --tail=200 bot`.

No files indexed:
- Ensure bot is admin in source channel.
- Ensure `DB_CHANNEL_ID` matches that channel.

Mongo unhealthy:
- Check mongo logs: `docker compose logs mongo`.
- Ensure Docker has enough disk and memory.
