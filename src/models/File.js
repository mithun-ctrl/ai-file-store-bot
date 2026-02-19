import mongoose from "mongoose";

const MetadataSchema = new mongoose.Schema(
  {
    title: { type: String, default: null, trim: true },
    year: { type: Number, default: null },
    season: { type: Number, default: null },
    episode: { type: Number, default: null },
    quality: { type: String, default: null },
    language: { type: String, default: null },
    resolution: { type: String, default: null },
    type: {
      type: String,
      enum: ["movie", "series", "anime", "other"],
      default: "other"
    }
  },
  { _id: false }
);

const FileSchema = new mongoose.Schema(
  {
    fileId: { type: String, required: true },
    fileUniqueId: { type: String, required: true, unique: true, index: true },
    fileName: { type: String, default: null },
    fileSize: { type: Number, default: 0 },
    mimeType: { type: String, default: null },
    fileType: {
      type: String,
      enum: ["document", "video", "audio", "photo"],
      required: true
    },
    messageId: { type: Number, required: true },
    channelId: { type: Number, required: true },
    caption: { type: String, default: "" },
    metadata: { type: MetadataSchema, required: true },
    keywords: [{ type: String }]
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

FileSchema.index({ "metadata.title": 1 });
FileSchema.index({ keywords: 1 });
FileSchema.index({ createdAt: -1 });

export const File = mongoose.model("File", FileSchema);
