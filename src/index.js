import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "./config/database.js";
import { bot } from "./config/bot.js";

async function bootstrap() {
  await connectDB();

  bot.catch((error, ctx) => {
    console.error("[BOT] Unhandled error:", error.message, {
      updateType: ctx?.updateType
    });
  });

  await bot.launch();
  console.log("[BOT] Telegraf bot started");
}

async function shutdown(signal) {
  console.log(`[APP] ${signal} received, shutting down`);

  try {
    bot.stop(signal);
    await mongoose.connection.close(false);
  } catch (error) {
    console.error("[APP] Shutdown error:", error.message);
  } finally {
    process.exit(0);
  }
}

bootstrap().catch((error) => {
  console.error("[APP] Startup failed:", error.message);
  process.exit(1);
});

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
