import "dotenv/config";
import http from "node:http";

function toPositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

const monitorTargetUrl = String(process.env.MONITOR_TARGET_URL || "").trim();
if (!monitorTargetUrl) {
  throw new Error("MONITOR_TARGET_URL is required");
}

const checkIntervalMs = toPositiveInt(process.env.MONITOR_INTERVAL_SECONDS, 30) * 1000;
const requestTimeoutMs = toPositiveInt(process.env.MONITOR_TIMEOUT_SECONDS, 8) * 1000;
const monitorPort = toPositiveInt(process.env.MONITOR_PORT, 9090);
const monitorHost = process.env.MONITOR_HOST || "0.0.0.0";
const alertBotToken = String(process.env.MONITOR_ALERT_BOT_TOKEN || "").trim();
const alertChatId = String(process.env.MONITOR_ALERT_CHAT_ID || "").trim();
const notifyOnStart = String(process.env.MONITOR_NOTIFY_ON_START || "true").toLowerCase() === "true";

const state = {
  targetUrl: monitorTargetUrl,
  status: "unknown",
  lastHttpStatus: null,
  lastError: null,
  lastCheckAt: null,
  lastUpAt: null,
  lastDownAt: null
};

function nowIso() {
  return new Date().toISOString();
}

async function sendTelegramAlert(text) {
  if (!alertBotToken || !alertChatId) {
    return;
  }

  const url = `https://api.telegram.org/bot${alertBotToken}/sendMessage`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: alertChatId,
      text
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram alert failed (${response.status}): ${body}`);
  }
}

function statusMessage(status, details = "") {
  const icon = status === "up" ? "UP" : "DOWN";
  return `[HOME-MONITOR] ${icon} ${monitorTargetUrl}${details ? `\n${details}` : ""}\n${nowIso()}`;
}

async function runCheck() {
  const previousStatus = state.status;
  let nextStatus = "down";
  let nextHttpStatus = null;
  let nextError = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
    const response = await fetch(monitorTargetUrl, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "user-agent": "file-link-store-home-monitor/1.0"
      }
    });
    clearTimeout(timeout);

    nextHttpStatus = response.status;
    nextStatus = response.ok ? "up" : "down";
  } catch (error) {
    nextError = error.message || String(error);
    nextStatus = "down";
  }

  state.status = nextStatus;
  state.lastHttpStatus = nextHttpStatus;
  state.lastError = nextError;
  state.lastCheckAt = nowIso();

  if (nextStatus === "up") {
    state.lastUpAt = state.lastCheckAt;
  } else {
    state.lastDownAt = state.lastCheckAt;
  }

  const statusChanged = previousStatus !== "unknown" && previousStatus !== nextStatus;
  const shouldSendInitial = previousStatus === "unknown" && notifyOnStart;

  if (statusChanged || shouldSendInitial) {
    const details = nextStatus === "down" ? `httpStatus=${nextHttpStatus || "n/a"} error=${nextError || "none"}` : `httpStatus=${nextHttpStatus}`;
    try {
      await sendTelegramAlert(statusMessage(nextStatus, details));
    } catch (alertError) {
      console.error("[HOME-MONITOR] Alert error:", alertError.message);
    }
  }

  console.log(
    `[HOME-MONITOR] ${state.lastCheckAt} status=${nextStatus} http=${nextHttpStatus || "n/a"} error=${nextError || "none"}`
  );
}

function startStatusServer() {
  const server = http.createServer((req, res) => {
    const path = new URL(req.url || "/", "http://localhost").pathname;
    if (path !== "/" && path !== "/health") {
      res.writeHead(404, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "Not found" }));
      return;
    }

    const ok = state.status === "up";
    res.writeHead(ok ? 200 : 503, { "content-type": "application/json; charset=utf-8" });
    res.end(
      JSON.stringify({
        monitor: "file-link-store-home-monitor",
        status: state.status,
        ...state
      })
    );
  });

  server.listen(monitorPort, monitorHost, () => {
    console.log(`[HOME-MONITOR] Status server listening on http://${monitorHost}:${monitorPort}`);
  });
}

async function bootstrap() {
  startStatusServer();
  await runCheck();
  setInterval(() => {
    runCheck().catch((error) => {
      console.error("[HOME-MONITOR] Check error:", error.message);
    });
  }, checkIntervalMs);
}

bootstrap().catch((error) => {
  console.error("[HOME-MONITOR] Startup failed:", error.message);
  process.exit(1);
});
