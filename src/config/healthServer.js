import http from "node:http";

function toPositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

export function createHealthServer() {
  const host = process.env.HEALTH_HOST || "0.0.0.0";
  const port = toPositiveInt(process.env.HEALTH_PORT, 8080);

  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url || "/", "http://localhost").pathname;
    if (pathname !== "/") {
      res.writeHead(404, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "Not found" }));
      return;
    }

    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ status: "Bot Running" }));
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
    setBotLaunched() {},
    setShuttingDown() {}
  };
}
