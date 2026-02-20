# Home Monitor Guide (UP/DOWN Check)

Use this when you want a server at home to continuously check whether your bot is up.

## 1. Bot health endpoint
The bot exposes these endpoints:
- `/` (default readiness endpoint)
- `/health` (same as `/`)
- `/health/ready` (same readiness result)
- `/health/live` (process alive check)

Ready endpoint returns:
- `200` when bot + DB are ready.
- `503` when bot is down/not ready.

## 2. Enable health endpoint on bot server
In bot `.env`:

```env
HEALTH_HOST=0.0.0.0
HEALTH_PORT=8080
```

If using firewall, allow only your home IP to access this port.

Test from VPS:

```bash
curl -i http://127.0.0.1:8080/
```

## 3. Run home monitor script
On your home machine:

```bash
git clone https://github.com/mithun-ctrl/ai-file-store-bot.git file-link-store-bot
cd file-link-store-bot
npm install
cp .env.home-monitor.example .env
```

Edit `.env`:
- Set `MONITOR_TARGET_URL` to your bot URL (use `/` endpoint).
- Optional: set `MONITOR_ALERT_BOT_TOKEN` + `MONITOR_ALERT_CHAT_ID` for Telegram alerts.

Run:

```bash
npm run monitor:home
```

## 4. Home monitor status endpoint
The home monitor also starts a local status server:
- `http://<home-ip>:9090/`
- `http://<home-ip>:9090/health`

It returns:
- `200` when target is up.
- `503` when target is down.

## 5. Recommended production setup at home
- Run monitor with `systemd`/`pm2` so it auto-restarts.
- Keep monitor interval at 15-60 seconds.
- Restrict bot health port access to home IP only.
