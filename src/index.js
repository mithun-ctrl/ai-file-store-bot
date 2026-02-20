import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "./config/database.js";
import { bot } from "./config/bot.js";
import { createHealthServer } from "./config/healthServer.js";

const healthServer = createHealthServer();

async function bootstrap() {
  await healthServer.start();
  await connectDB();

  bot.catch((error, ctx) => {
    console.error("[BOT] Unhandled error:", error.message, {
      updateType: ctx?.updateType
    });
  });

  await bot.launch();
  healthServer.setBotLaunched(true);
  console.log("[BOT] Telegraf bot started");
}

async function shutdown(signal) {
  console.log(`[APP] ${signal} received, shutting down`);
  healthServer.setShuttingDown(true);

  try {
    bot.stop(signal);
    await mongoose.connection.close(false);
    await healthServer.stop();
  } catch (error) {
    console.error("[APP] Shutdown error:", error.message);
  } finally {
    process.exit(0);
  }
}

bootstrap().catch((error) => {
  healthServer.setShuttingDown(true);
  console.error("[APP] Startup failed:", error.message);
  process.exit(1);
});

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
