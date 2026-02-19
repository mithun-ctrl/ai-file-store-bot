const YEAR_REGEX = /(19\d{2}|20\d{2})/;
const SEASON_REGEX = /s(?:eason)?\s?(\d{1,2})/i;
const EPISODE_REGEX = /e(?:pisode)?\s?(\d{1,3})/i;
const QUALITY_REGEX = /(2160p|1440p|1080p|720p|480p|4k|hdrip|web-dl|webrip|bluray)/i;
const LANGUAGE_REGEX = /(hindi|english|tamil|telugu|malayalam|japanese|korean)/i;

function normalize(text = "") {
  return text
    .replace(/[._\-()[\]]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function inferType(text = "") {
  const lower = text.toLowerCase();
  if (lower.includes("anime")) return "anime";
  if (/s\d{1,2}e\d{1,3}|season|episode/.test(lower)) return "series";
  if (/movie|film|bluray|webrip|web-dl|hdrip/.test(lower)) return "movie";
  return "other";
}

export function extractRegexMetadata(fileName = "", caption = "") {
  const merged = normalize(`${fileName} ${caption}`);
  const year = merged.match(YEAR_REGEX)?.[0] || null;
  const season = merged.match(SEASON_REGEX)?.[1] || null;
  const episode = merged.match(EPISODE_REGEX)?.[1] || null;
  const quality = merged.match(QUALITY_REGEX)?.[0] || null;
  const language = merged.match(LANGUAGE_REGEX)?.[0] || null;

  const title = normalize(
    merged
      .replace(YEAR_REGEX, "")
      .replace(SEASON_REGEX, "")
      .replace(EPISODE_REGEX, "")
      .replace(QUALITY_REGEX, "")
      .replace(LANGUAGE_REGEX, "")
  );

  const metadata = {
    title: title || fileName || null,
    year: year ? Number(year) : null,
    season: season ? Number(season) : null,
    episode: episode ? Number(episode) : null,
    quality,
    language: language?.toLowerCase() || null,
    resolution: quality?.toLowerCase().includes("p") ? quality.toLowerCase() : null,
    type: inferType(merged)
  };

  const keywords = Array.from(
    new Set(
      normalize(`${fileName} ${caption} ${metadata.title || ""}`)
        .toLowerCase()
        .split(" ")
        .filter((token) => token.length > 1)
    )
  ).slice(0, 80);

  return { metadata, keywords };
}
