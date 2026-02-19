import { extractFileData } from "../utils/extractFileData.js";
import { extractRegexMetadata } from "../services/metadataService.js";
import { createFile } from "../services/fileService.js";
import { createLink } from "../services/linkService.js";

const mediaGroupBuffer = new Map();
const MEDIA_GROUP_DELAY_MS = 1500;

async function processPosts(posts) {
  const storedFiles = [];

  for (const post of posts) {
    const fileData = extractFileData(post);
    if (!fileData) {
      continue;
    }

    const parsed = extractRegexMetadata(fileData.fileName, fileData.caption);

    const fileDoc = await createFile({
      ...fileData,
      metadata: parsed.metadata,
      keywords: parsed.keywords
    });

    storedFiles.push(fileDoc);
  }

  if (storedFiles.length === 0) {
    return null;
  }

  const link = await createLink(storedFiles.map((file) => file._id));
  const deepLink = process.env.BOT_USERNAME
    ? `https://t.me/${process.env.BOT_USERNAME}?start=${link.linkId}`
    : link.linkId;
  console.log(`[CHANNEL] Link created: ${deepLink}`);
  return link;
}

function scheduleMediaGroup(groupId, post) {
  const existing = mediaGroupBuffer.get(groupId);

  if (existing?.timer) {
    clearTimeout(existing.timer);
  }

  const entry = existing || { posts: [] };
  entry.posts.push(post);
  entry.timer = setTimeout(async () => {
    try {
      const current = mediaGroupBuffer.get(groupId);
      if (!current) {
        return;
      }

      mediaGroupBuffer.delete(groupId);
      const link = await processPosts(current.posts);
      if (link) {
        console.log(`[CHANNEL] Processed media group ${groupId}, link: ${link.linkId}`);
      }
    } catch (error) {
      console.error("[CHANNEL] Media group processing error:", error.message);
    }
  }, MEDIA_GROUP_DELAY_MS);

  mediaGroupBuffer.set(groupId, entry);
}

export async function channelPostHandler(ctx) {
  try {
    const post = ctx.channelPost;
    if (!post?.chat?.id) {
      return;
    }

    if (String(post.chat.id) !== String(process.env.DB_CHANNEL_ID)) {
      return;
    }

    if (post.media_group_id) {
      scheduleMediaGroup(String(post.media_group_id), post);
      return;
    }

    const link = await processPosts([post]);
    if (link) {
      console.log(`[CHANNEL] Processed post ${post.message_id}, link: ${link.linkId}`);
    }
  } catch (error) {
    console.error("[CHANNEL] Error:", error.message);
  }
}
