import { File } from "../models/File.js";
import { Link } from "../models/Link.js";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildSearchFilter(query) {
  const regex = new RegExp(escapeRegex(query), "i");
  return {
    $or: [
      { fileName: regex },
      { caption: regex },
      { "metadata.title": regex },
      { keywords: regex }
    ]
  };
}

async function resolveLinkIdsForFiles(files) {
  const ids = files.map((file) => String(file._id));
  const idSet = new Set(ids);
  if (ids.length === 0) {
    return new Map();
  }

  const links = await Link.find({ files: { $in: ids } })
    .sort({ createdAt: -1 })
    .select("linkId files")
    .lean();

  const linkByFileId = new Map();
  for (const link of links) {
    for (const fileId of link.files || []) {
      const id = String(fileId);
      if (idSet.has(id) && !linkByFileId.has(id)) {
        linkByFileId.set(id, link.linkId);
      }
    }
  }

  return linkByFileId;
}

export async function searchFilesWithLinks(query, options = {}) {
  const normalizedQuery = String(query || "").trim();
  const limit = Math.max(1, Number(options.limit) || 10);

  if (!normalizedQuery) {
    return {
      query: "",
      page: 1,
      total: 0,
      totalPages: 0,
      results: []
    };
  }

  const filter = buildSearchFilter(normalizedQuery);
  const total = await File.countDocuments(filter);

  if (total === 0) {
    return {
      query: normalizedQuery,
      page: 1,
      total,
      totalPages: 0,
      results: []
    };
  }

  const totalPages = Math.ceil(total / limit);
  const requestedPage = Math.max(1, Number(options.page) || 1);
  const page = Math.min(requestedPage, totalPages);
  const skip = (page - 1) * limit;

  const files = await File.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const linkByFileId = await resolveLinkIdsForFiles(files);
  const results = files.map((file) => ({
    ...file,
    linkId: linkByFileId.get(String(file._id)) || null
  }));

  return {
    query: normalizedQuery,
    page,
    total,
    totalPages,
    results
  };
}
