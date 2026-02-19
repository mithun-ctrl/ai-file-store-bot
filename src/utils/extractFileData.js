function detectFile(channelPost) {
  if (channelPost.document) {
    return { fileType: "document", file: channelPost.document };
  }

  if (channelPost.video) {
    return { fileType: "video", file: channelPost.video };
  }

  if (channelPost.audio) {
    return { fileType: "audio", file: channelPost.audio };
  }

  if (Array.isArray(channelPost.photo) && channelPost.photo.length) {
    const sorted = [...channelPost.photo].sort((a, b) => {
      const sizeA = (a.file_size || 0) + (a.width || 0) * (a.height || 0);
      const sizeB = (b.file_size || 0) + (b.width || 0) * (b.height || 0);
      return sizeA - sizeB;
    });

    return { fileType: "photo", file: sorted[sorted.length - 1] };
  }

  return null;
}

export function extractFileData(channelPost) {
  const detected = detectFile(channelPost);
  if (!detected) {
    return null;
  }

  const { fileType, file } = detected;

  return {
    fileId: file.file_id,
    fileUniqueId: file.file_unique_id,
    fileName: file.file_name || `${fileType}_${file.file_unique_id}`,
    fileSize: file.file_size || 0,
    mimeType: file.mime_type || (fileType === "photo" ? "image/jpeg" : null),
    fileType,
    messageId: channelPost.message_id,
    channelId: channelPost.chat.id,
    caption: channelPost.caption || ""
  };
}
