import { Telegraf } from "telegraf";
import { channelPostHandler } from "../handlers/channelPostHandler.js";
import { searchCommandHandler, searchPaginationHandler } from "../handlers/searchHandler.js";
import { startHandler } from "../handlers/startHandler.js";

if (!process.env.BOT_TOKEN) {
  throw new Error("BOT_TOKEN is required");
}

export const bot = new Telegraf(process.env.BOT_TOKEN);

bot.on("channel_post", channelPostHandler);
bot.start(startHandler);
bot.command("search", searchCommandHandler);
bot.action(/^srch:[a-z0-9]+:\d+$/i, searchPaginationHandler);
bot.action("srch:noop", (ctx) => ctx.answerCbQuery());
