import http from "node:http";
import mongoose from "mongoose";

const READY_STATE_LABELS = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting"
};

function toPositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function getDbStatus() {
  const state = mongoose.connection.readyState;
  return {
    readyState: state,
    label: READY_STATE_LABELS[state] || "unknown",
    connected: state === 1
  };
}

export function createHealthServer() {
  const startedAt = new Date();
  const host = process.env.HEALTH_HOST || "0.0.0.0";
  const port = toPositiveInt(process.env.HEALTH_PORT, 8080);
  let botLaunched = false;
  let shuttingDown = false;

  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url || "/", "http://localhost").pathname;
    const db = getDbStatus();
    const ready = db.connected && botLaunched && !shuttingDown;

    if (pathname === "/") {
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ status: "Bot Running" }));
      return;
    }

    const payload = {
      status: ready ? "up" : "down",
      service: "file-link-store-bot",
      botLaunched,
      shuttingDown,
      db,
      uptimeSec: Math.floor((Date.now() - startedAt.getTime()) / 1000),
      timestamp: new Date().toISOString()
    };

    if (pathname === "/health/live") {
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ ...payload, status: "up" }));
      return;
    }

    if (pathname === "/health/ready" || pathname === "/health") {
      res.writeHead(ready ? 200 : 503, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(payload));
      return;
    }

    res.writeHead(404, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Not found" }));
  });

  return {
    start() {
      return new Promise((resolve) => {
        server.listen(port, host, () => {
          console.log(`[HEALTH] Listening on http://${host}:${port}`);
          resolve();
        });
      });
    },
    stop() {
      return new Promise((resolve) => {
        server.close(() => resolve());
      });
    },
    setBotLaunched(value) {
      botLaunched = Boolean(value);
    },
    setShuttingDown(value) {
      shuttingDown = Boolean(value);
    }
  };
}
