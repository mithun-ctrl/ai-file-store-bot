import { findLinkWithFiles } from "../services/linkService.js";

function resolveLinkId(ctx) {
  if (ctx.startPayload) {
    return ctx.startPayload.trim();
  }

  const text = ctx.message?.text || "";
  const [, payload] = text.split(" ");
  return payload?.trim() || "";
}

async function sendFileByType(ctx, userId, file) {
  const caption = file.caption || file.metadata?.title || "";

  if (file.fileType === "document") {
    return ctx.telegram.sendDocument(userId, file.fileId, { caption });
  }

  if (file.fileType === "video") {
    return ctx.telegram.sendVideo(userId, file.fileId, { caption });
  }

  if (file.fileType === "audio") {
    return ctx.telegram.sendAudio(userId, file.fileId, { caption });
  }

  if (file.fileType === "photo") {
    return ctx.telegram.sendPhoto(userId, file.fileId, { caption });
  }

  return null;
}

export async function startHandler(ctx) {
  try {
    const userId = ctx.from?.id;
    const linkId = resolveLinkId(ctx);

    if (!linkId) {
      await ctx.reply("Use /search <name> to find files, or open a deep link: /start <linkId>");
      return;
    }

    const link = await findLinkWithFiles(linkId);
    if (!link || !link.files?.length) {
      await ctx.reply("Invalid or expired link.");
      return;
    }

    for (const file of link.files) {
      await sendFileByType(ctx, userId, file);
    }
  } catch (error) {
    console.error("[START] Error:", error.message);
    await ctx.reply("Failed to fetch files. Please try again.");
  }
}
