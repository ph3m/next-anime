import { HiAnime } from "aniwatch";

const scraper = new HiAnime.Scraper();

export async function findHiAnimeId(title: string): Promise<string | null> {
  try {
    const results = await scraper.search(title);
    if (!results.animes?.length) return null;
    const lower = title.toLowerCase();
    const match = results.animes.find(a =>
      (a.name ?? "").toLowerCase().includes(lower) ||
      lower.includes((a.name ?? "").toLowerCase())
    ) || results.animes[0];
    return match.id;
  } catch { return null; }
}

export interface HiAnimeEpisode {
  number: number;
  title: string;
  episodeId: string;
  isFiller: boolean;
}

export async function getHiAnimeEpisodes(animeId: string): Promise<HiAnimeEpisode[]> {
  try {
    const data = await scraper.getEpisodes(animeId);
    return (data.episodes || [])
      .filter(ep => ep.episodeId != null)
      .map(ep => ({
        number: ep.number,
        title: ep.title || `Episode ${ep.number}`,
        episodeId: ep.episodeId as string,
        isFiller: ep.isFiller || false,
      }));
  } catch { return []; }
}

export interface HiAnimeSource {
  url: string;
  isM3U8: boolean;
  quality?: string;
}

export interface HiAnimeStream {
  sources: HiAnimeSource[];
  subtitles: { lang: string; url: string }[];
  headers: Record<string, string>;
}

const SERVERS = [
  HiAnime.Servers.VidStreaming,
  HiAnime.Servers.VidCloud,
  HiAnime.Servers.MegaCloud,
];

export async function getHiAnimeStream(
  episodeId: string,
  category: "sub" | "dub" | "raw" = "sub"
): Promise<HiAnimeStream | null> {
  for (const server of SERVERS) {
    try {
      const data = await scraper.getEpisodeSources(episodeId, server as unknown as never, category);
      if (!data.sources?.length) continue;
      return {
        sources: data.sources.map(s => ({
          url: s.url,
          isM3U8: s.isM3U8 ?? s.url.includes(".m3u8"),
          quality: (s as { quality?: string }).quality,
        })),
        subtitles: (data.subtitles || []).map(s => ({ lang: s.lang, url: s.url })),
        headers: (data.headers as Record<string, string>) || {},
      };
    } catch { continue; }
  }
  return null;
}
