// Consumet Meta/AniList endpoint — maps AniList IDs to stream sources
// Docs: https://docs.consumet.org/rest-api/Meta/anilist-anime
const CONSUMET_BASE = "http://localhost:4000/meta/anilist";

export interface ConsumetEpisode {
  id: string;
  title: string | null;
  description: string | null;
  number: number;
  image: string | null;
  airDate: string | null;
}

export interface StreamSource {
  url: string;
  isM3U8: boolean;
  quality: string;
}

export interface StreamData {
  headers: { Referer: string };
  sources: StreamSource[];
  download?: string;
}

// Get episode list for an AniList anime ID
export async function getEpisodes(anilistId: number, provider = "gogoanime"): Promise<ConsumetEpisode[]> {
  try {
    const res = await fetch(
      `${CONSUMET_BASE}/episodes/${anilistId}?provider=${provider}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// Get streaming links for an episode ID
export async function getStreamSources(episodeId: string, provider = "gogoanime"): Promise<StreamData | null> {
  try {
    const res = await fetch(
      `${CONSUMET_BASE}/watch/${encodeURIComponent(episodeId)}?provider=${provider}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
