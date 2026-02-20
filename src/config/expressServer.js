import express from "express";

function toPositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

export function createExpressServer() {
  const host = process.env.HOST || "0.0.0.0";
  const port = toPositiveInt(process.env.PORT, 8080);
  const app = express();
  let server = null;

  const router = express.Router();
  router.get("/", async (req, res) => {
    res.send({ botSatus: "Bot is Running.." });
  });

  app.use(router);

  return {
    start() {
      return new Promise((resolve) => {
        server = app.listen(port, host, () => {
          console.log(`[EXPRESS] Listening on http://${host}:${port}`);
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
