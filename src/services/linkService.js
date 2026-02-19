import { Link } from "../models/Link.js";
import { generateLinkId } from "../utils/generateLinkId.js";

export async function createLink(fileIds) {
  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    throw new Error("createLink requires at least one file id");
  }

  const uniqueFileIds = [...new Set(fileIds.map((id) => String(id)))];

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const linkId = generateLinkId();

    try {
      const link = await Link.create({
        linkId,
        files: uniqueFileIds
      });

      console.log(`[LINK] Generated: ${linkId}`);
      return link;
    } catch (error) {
      if (error.code !== 11000) {
        throw error;
      }
    }
  }

  throw new Error("Failed to generate a unique linkId");
}

export async function findLinkWithFiles(linkId) {
  return Link.findOne({ linkId }).populate("files");
}
