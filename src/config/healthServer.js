import express from "express";

function toPositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

export function createHealthServer() {
  const host = process.env.HEALTH_HOST || "0.0.0.0";
  const port = toPositiveInt(process.env.PORT, 8080);
  const app = express();
  let server = null;

  app.get("/", (req, res) => {
    res.status(200).json({ status: "Bot is Running" });
  });

  app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  return {
    start() {
      return new Promise((resolve) => {
        server = app.listen(port, host, () => {
          console.log(`[HEALTH] Listening on http://${host}:${port}`);
          resolve();
        });
      });
    },
    stop() {
      return new Promise((resolve) => {
        if (!server) {
          resolve();
          return;
        }

        server.close(() => resolve());
      });
    }
  };
}
