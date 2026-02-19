import mongoose from "mongoose";

const LinkSchema = new mongoose.Schema(
  {
    linkId: { type: String, required: true, unique: true, index: true },
    files: [{ type: mongoose.Schema.Types.ObjectId, ref: "File", required: true }]
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

LinkSchema.index({ createdAt: -1 });

export const Link = mongoose.model("Link", LinkSchema);
