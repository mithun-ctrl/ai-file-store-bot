import { File } from "../models/File.js";

export async function createFile(fileData) {
  const existing = await File.findOne({ fileUniqueId: fileData.fileUniqueId });
  if (existing) {
    console.log(`[FILE] Duplicate skipped: ${existing.fileName || existing.fileUniqueId}`);
    return existing;
  }

  try {
    const doc = await File.findOneAndUpdate(
      { fileUniqueId: fileData.fileUniqueId },
      { $setOnInsert: fileData },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    console.log(`[FILE] Stored: ${doc.fileName || doc.fileUniqueId}`);
    return doc;
  } catch (error) {
    if (error.code === 11000) {
      const duplicated = await File.findOne({ fileUniqueId: fileData.fileUniqueId });
      if (duplicated) {
        console.log(`[FILE] Duplicate skipped: ${duplicated.fileName || duplicated.fileUniqueId}`);
        return duplicated;
      }
    }

    throw error;
  }
}
