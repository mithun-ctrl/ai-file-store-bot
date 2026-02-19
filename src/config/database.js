import mongoose from "mongoose";
import { File } from "../models/File.js";
import { Link } from "../models/Link.js";

async function migrateLegacyIndexes() {
  const collection = mongoose.connection.db.collection("files");
  const indexes = await collection.indexes();
  const legacyTextIndex = indexes.find(
    (idx) => idx.name === "metadata.title_text_caption_text_fileName_text"
  );

  if (legacyTextIndex) {
    await collection.dropIndex(legacyTextIndex.name);
    console.log(`[DB] Dropped legacy index: ${legacyTextIndex.name}`);
  }
}

export async function connectDB() {
  const { DB_URI } = process.env;

  if (!DB_URI) {
    throw new Error("DB_URI is required");
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(DB_URI, {
    maxPoolSize: 50,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000
  });

  await migrateLegacyIndexes();
  await File.syncIndexes();
  await Link.syncIndexes();

  console.log("[DB] Connected");
}
