# VPS Deployment Guide (Ubuntu + systemd)

This guide explains how to deploy `file-link-store-bot` on a VPS for 24/7 usage.

## 1. Server prerequisites
- Ubuntu 22.04 or 24.04
- A non-root sudo user
- Open internet access for Telegram + MongoDB endpoint

Update server:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl ca-certificates
```

## 2. Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

## 3. MongoDB setup
Choose one:

- Option A (recommended): MongoDB Atlas (managed cloud DB).
- Option B: local MongoDB server on VPS.

If using Atlas, whitelist your VPS IP and copy connection URI.

## 4. Clone project

```bash
cd /opt
sudo git clone https://github.com/mithun-ctrl/ai-file-store-bot.git /opt/file-link-store-bot
sudo chown -R $USER:$USER /opt/file-link-store-bot
cd /opt/file-link-store-bot
```

Install dependencies:

```bash
npm ci
```

## 5. Configure environment

```bash
cp .env.example .env
nano .env
```

Set:
- `BOT_TOKEN`
- `BOT_USERNAME` (without `@`)
- `DB_URI`
- `DB_CHANNEL_ID` (example: `-1001234567890`)
- `HEALTH_HOST` (recommended: `0.0.0.0`)
- `HEALTH_PORT` (recommended: `8080`)

## 6. Run once for verification

```bash
npm run start
```

If startup looks good (`[DB] Connected`, `[BOT] Telegraf bot started`), stop with `Ctrl + C`.

## 7. Create systemd service

Create service file:

```bash
sudo nano /etc/systemd/system/file-link-store-bot.service
```

Paste:

```ini
[Unit]
Description=File Link Store Telegram Bot
After=network.target

[Service]
Type=simple
User=ubuntu
Group=ubuntu
WorkingDirectory=/opt/file-link-store-bot
Environment=NODE_ENV=production
EnvironmentFile=/opt/file-link-store-bot/.env
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Notes:
- Replace `User` and `Group` with your VPS user if not `ubuntu`.
- Confirm node path with `which node`. If different, update `ExecStart`.

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable file-link-store-bot
sudo systemctl start file-link-store-bot
sudo systemctl status file-link-store-bot
```

## 8. Logs and operations

Live logs:

```bash
sudo journalctl -u file-link-store-bot -f
```

Restart:

```bash
sudo systemctl restart file-link-store-bot
```

Stop:

```bash
sudo systemctl stop file-link-store-bot
```

## 9. Health check endpoint
Default endpoint:

```bash
curl -i http://127.0.0.1:8080/
```

Expected:
- `200` if bot is ready.
- `503` if bot is down/not ready.

For home monitoring, expose `HEALTH_PORT` in firewall only for your home public IP.

## 10. Updating bot on VPS

```bash
cd /opt/file-link-store-bot
git pull origin main
npm ci
sudo systemctl restart file-link-store-bot
sudo journalctl -u file-link-store-bot -n 50 --no-pager
```

## 11. Security checklist
- Keep `.env` private and never commit it.
- Use strong DB credentials.
- Restrict MongoDB access by IP/network.
- Keep OS packages updated (`apt update && apt upgrade`).
- Use firewall rules (`ufw`) and allow only required ports.

## 12. Troubleshooting

Service fails to start:
- Check `sudo systemctl status file-link-store-bot`.
- Check logs with `journalctl`.
- Validate `.env` values.

No files are being indexed:
- Ensure bot is admin in source channel.
- Ensure `DB_CHANNEL_ID` is correct.
- Send test file in the same configured channel.

Search returns no deep link:
- Ensure `BOT_USERNAME` is set correctly.
