import { Markup } from "telegraf";
import { customAlphabet } from "nanoid";
import { searchFilesWithLinks } from "../services/searchService.js";

const PAGE_SIZE = 10;
const SESSION_TTL_MS = 30 * 60 * 1000;
const MAX_QUERY_LENGTH = 100;
const createSearchSessionId = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 8);
const searchSessions = new Map();

function cleanupExpiredSessions() {
  const cutoff = Date.now() - SESSION_TTL_MS;
  for (const [key, value] of searchSessions.entries()) {
    if (!value || value.createdAt < cutoff) {
      searchSessions.delete(key);
    }
  }
}

function createSession(userId, query) {
  cleanupExpiredSessions();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const id = createSearchSessionId();
    if (!searchSessions.has(id)) {
      searchSessions.set(id, { userId, query, createdAt: Date.now() });
      return id;
    }
  }

  throw new Error("Failed to create search session");
}

function getSession(sessionId) {
  cleanupExpiredSessions();
  return searchSessions.get(sessionId) || null;
}

function getSearchQuery(text = "") {
  return String(text).replace(/^\/search(?:@\w+)?\s*/i, "").trim();
}

function truncate(text, size = 56) {
  const value = String(text || "").trim();
  if (value.length <= size) {
    return value;
  }

  return `${value.slice(0, size - 3)}...`;
}

function buildResultTitle(file, index) {
  const name = file.metadata?.title || file.fileName || "Unnamed file";
  return truncate(`${index}. ${name}`);
}

function buildDeepLink(linkId) {
  if (!linkId || !process.env.BOT_USERNAME) {
    return null;
  }

  return `https://t.me/${process.env.BOT_USERNAME}?start=${linkId}`;
}

function buildPaginationButtons(sessionId, page, totalPages) {
  if (totalPages <= 1) {
    return [];
  }

  const row = [];
  if (page > 1) {
    row.push(Markup.button.callback("Prev", `srch:${sessionId}:${page - 1}`));
  }

  row.push(Markup.button.callback(`${page}/${totalPages}`, "srch:noop"));

  if (page < totalPages) {
    row.push(Markup.button.callback("Next", `srch:${sessionId}:${page + 1}`));
  }

  return [row];
}

function buildResultsKeyboard(searchResult, sessionId) {
  const rows = [];
  const startIndex = (searchResult.page - 1) * PAGE_SIZE + 1;

  for (let i = 0; i < searchResult.results.length; i += 1) {
    const file = searchResult.results[i];
    const label = buildResultTitle(file, startIndex + i);
    const deepLink = buildDeepLink(file.linkId);

    if (deepLink) {
      rows.push([Markup.button.url(label, deepLink)]);
    } else {
      rows.push([Markup.button.callback(`${label} (no link)`, "srch:noop")]);
    }
  }

  return Markup.inlineKeyboard([
    ...rows,
    ...buildPaginationButtons(sessionId, searchResult.page, searchResult.totalPages)
  ]);
}

function buildResultsText(query, searchResult) {
  return [
    `Search: ${query}`,
    `Results: ${searchResult.total}`,
    `Page: ${searchResult.page}/${Math.max(searchResult.totalPages, 1)}`,
    "",
    "Tap a button to open the stored file link."
  ].join("\n");
}

async function renderSearchPage(ctx, sessionId, page, editMode = false) {
  const session = getSession(sessionId);
  if (!session) {
    if (editMode) {
      await ctx.answerCbQuery("Search expired. Use /search again.", { show_alert: true });
    }

    return;
  }

  const searchResult = await searchFilesWithLinks(session.query, { page, limit: PAGE_SIZE });
  if (searchResult.total === 0) {
    const text = `No files found for "${session.query}".`;
    if (editMode) {
      await ctx.editMessageText(text).catch(() => {});
      return;
    }

    await ctx.reply(text);
    return;
  }

  const text = buildResultsText(session.query, searchResult);
  const keyboard = buildResultsKeyboard(searchResult, sessionId);

  if (editMode) {
    await ctx.editMessageText(text, keyboard).catch(() => {});
    return;
  }

  await ctx.reply(text, keyboard);
}

export async function searchCommandHandler(ctx) {
  try {
    const query = getSearchQuery(ctx.message?.text);

    if (!query) {
      await ctx.reply("Usage: /search <file name>");
      return;
    }

    if (query.length > MAX_QUERY_LENGTH) {
      await ctx.reply(`Search text is too long. Max ${MAX_QUERY_LENGTH} characters.`);
      return;
    }

    const sessionId = createSession(ctx.from?.id, query);
    await renderSearchPage(ctx, sessionId, 1, false);
  } catch (error) {
    console.error("[SEARCH] Command error:", error.message);
    await ctx.reply("Search failed. Please try again.");
  }
}

export async function searchPaginationHandler(ctx) {
  try {
    const data = String(ctx.callbackQuery?.data || "");

    if (data === "srch:noop") {
      await ctx.answerCbQuery();
      return;
    }

    const match = data.match(/^srch:([a-z0-9]+):(\d+)$/i);
    if (!match) {
      await ctx.answerCbQuery();
      return;
    }

    const [, sessionId, nextPageRaw] = match;
    const session = getSession(sessionId);
    if (!session) {
      await ctx.answerCbQuery("Search expired. Use /search again.", { show_alert: true });
      return;
    }

    if (String(session.userId) !== String(ctx.from?.id)) {
      await ctx.answerCbQuery("This search result belongs to another user.", {
        show_alert: true
      });
      return;
    }

    await ctx.answerCbQuery();
    await renderSearchPage(ctx, sessionId, Number(nextPageRaw), true);
  } catch (error) {
    console.error("[SEARCH] Pagination error:", error.message);
    await ctx.answerCbQuery("Unable to change page.");
  }
}
