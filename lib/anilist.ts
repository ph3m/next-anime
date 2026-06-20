// ─────────────────────────────────────────────────────────────────────────────
// AniList GraphQL client with an in-memory cache + in-flight request
// coalescing. This is the main lever for handling concurrent users:
//   • Identical queries (same query string + variables) made by many
//     concurrent requests share a single outbound fetch instead of each
//     firing its own — this is what protects us from thundering-herd
//     traffic against AniList's rate limit (~90 req/min).
//   • A short-lived TTL cache means popular endpoints (trending, popular,
//     seasonal, browse, schedule) are served from memory for repeat
//     visitors without hitting the network at all.
//   • 429 responses are retried with backoff honoring AniList's
//     Retry-After header instead of failing the whole request.
// ─────────────────────────────────────────────────────────────────────────────

const ANILIST_URL = "https://graphql.anilist.co";
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const FETCH_TIMEOUT_MS = 12_000;

interface CacheEntry<T> { data: T; expiresAt: number; }

const cache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

// Periodically sweep expired entries so the cache doesn't grow unbounded
// under sustained traffic with many distinct queries (e.g. many different
// search terms or anime ids).
let lastSweep = Date.now();
function sweepExpired() {
  const now = Date.now();
  if (now - lastSweep < 60_000) return; // sweep at most once a minute
  lastSweep = now;
  for (const [key, entry] of cache) {
    if (entry.expiresAt < now) cache.delete(key);
  }
}

async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function gql<T>(
  query: string,
  variables: Record<string, unknown> = {},
  opts: { ttl?: number } = {}
): Promise<T> {
  sweepExpired();
  const ttl = opts.ttl ?? DEFAULT_TTL_MS;
  const cacheKey = JSON.stringify({ query, variables });

  // 1. Serve from cache if fresh — no network call at all.
  const cached = cache.get(cacheKey) as CacheEntry<T> | undefined;
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  // 2. Coalesce concurrent identical requests into one in-flight promise.
  const existing = inFlight.get(cacheKey) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = (async () => {
    let attempt = 0;
    // 1 retry on rate-limit (429), honoring Retry-After when present.
    for (;;) {
      attempt++;
      let res: Response;
      try {
        res = await fetchWithTimeout(
          ANILIST_URL,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ query, variables }),
            next: { revalidate: Math.floor(ttl / 1000) },
          },
          FETCH_TIMEOUT_MS
        );
      } catch (err) {
        throw new Error(`AniList request failed: ${(err as Error).message}`);
      }

      if (res.status === 429 && attempt <= 2) {
        const retryAfter = parseFloat(res.headers.get("retry-after") || "1");
        await new Promise(r => setTimeout(r, Math.min(retryAfter, 5) * 1000));
        continue;
      }

      const json = await res.json();
      if (json.errors) throw new Error(json.errors[0]?.message || "AniList GraphQL error");

      const data = json.data as T;
      cache.set(cacheKey, { data, expiresAt: Date.now() + ttl });
      return data;
    }
  })();

  inFlight.set(cacheKey, promise);
  try {
    return await promise;
  } finally {
    inFlight.delete(cacheKey);
  }
}

const MEDIA_FIELDS = `
  id title { romaji english native }
  coverImage { large extraLarge }
  bannerImage description
  genres averageScore meanScore popularity
  status season seasonYear episodes duration
  format type
  studios(isMain: true) { nodes { name } }
  nextAiringEpisode { episode timeUntilAiring }
  trailer { id site }
  tags { name }
`;

export interface AniListMedia {
  id: number;
  idMal?: number | null;
  title: { romaji: string; english: string | null; native: string };
  coverImage: { large: string; extraLarge: string };
  bannerImage: string | null;
  description: string | null;
  genres: string[];
  averageScore: number | null;
  meanScore: number | null;
  popularity: number;
  status: string;
  season: string | null;
  seasonYear: number | null;
  episodes: number | null;
  duration: number | null;
  format: string;
  type: string;
  studios: { nodes: { name: string }[] };
  nextAiringEpisode: { episode: number; timeUntilAiring: number } | null;
  trailer: { id: string; site: string } | null;
  tags: { name: string }[];
}

export interface PageInfo {
  total: number;
  hasNextPage: boolean;
  currentPage: number;
  lastPage: number;
}

// ── Search ────────────────────────────────────────────────────────────────
export async function searchAnime(query: string, page = 1, perPage = 24) {
  const data = await gql<{ Page: { media: AniListMedia[]; pageInfo: PageInfo } }>(`
    query ($query: String, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total hasNextPage currentPage lastPage }
        media(search: $query, type: ANIME, sort: SEARCH_MATCH, isAdult: false) { ${MEDIA_FIELDS} }
      }
    }
  `, { query, page, perPage }, { ttl: 2 * 60 * 1000 }); // searches change less predictably, shorter TTL
  return data.Page;
}

// ── Trending ──────────────────────────────────────────────────────────────
export async function getTrending(page = 1, perPage = 24) {
  const data = await gql<{ Page: { media: AniListMedia[] } }>(`
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: TRENDING_DESC, isAdult: false) { ${MEDIA_FIELDS} }
      }
    }
  `, { page, perPage });
  return data.Page.media;
}

// ── Popular ───────────────────────────────────────────────────────────────
export async function getPopular(page = 1, perPage = 24) {
  const data = await gql<{ Page: { media: AniListMedia[] } }>(`
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) { ${MEDIA_FIELDS} }
      }
    }
  `, { page, perPage });
  return data.Page.media;
}

// ── Seasonal ─────────────────────────────────────────────────────────────
export async function getSeasonal(season: string, year: number, page = 1, perPage = 24) {
  const data = await gql<{ Page: { media: AniListMedia[] } }>(`
    query ($season: MediaSeason, $year: Int, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, season: $season, seasonYear: $year, sort: POPULARITY_DESC, isAdult: false) { ${MEDIA_FIELDS} }
      }
    }
  `, { season, year, page, perPage });
  return data.Page.media;
}

// ── Anime detail ──────────────────────────────────────────────────────────
export async function getAnimeById(id: number) {
  const data = await gql<{ Media: AniListMedia }>(`
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        idMal
        ${MEDIA_FIELDS}
        relations {
          edges {
            relationType
            node { id title { romaji english } coverImage { large } format status }
          }
        }
        recommendations(perPage: 8) {
          nodes { mediaRecommendation { id title { romaji english } coverImage { large } averageScore } }
        }
      }
    }
  `, { id }, { ttl: 10 * 60 * 1000 }); // detail pages change rarely, longer TTL
  return data.Media;
}

// ── Lightweight episode-count lookup (used by /api/episodes) ─────────────
export async function getEpisodeMeta(id: number) {
  const data = await gql<{ Media: { episodes: number | null; idMal: number | null; title: AniListMedia["title"] } }>(`
    query ($id: Int) {
      Media(id: $id, type: ANIME) { episodes idMal title { romaji english } }
    }
  `, { id }, { ttl: 30 * 60 * 1000 });
  return data.Media;
}

// ── Browse: combined multi-filter query (genre / type / theme / status / year / sort) ──
export type BrowseSort = "TRENDING_DESC" | "POPULARITY_DESC" | "SCORE_DESC" | "TITLE_ROMAJI" | "START_DATE_DESC";

export interface BrowseFilters {
  query?: string;
  genre?: string;
  tag?: string;       // "theme" in the UI
  format?: string;    // TV / MOVIE / OVA / ONA / SPECIAL / MUSIC
  status?: string;    // FINISHED / RELEASING / NOT_YET_RELEASED / CANCELLED
  season?: string;
  year?: number;
  sort?: BrowseSort;
  page?: number;
  perPage?: number;
}

export async function browseAnime(filters: BrowseFilters) {
  const {
    query, genre, tag, format, status, season, year,
    sort = "POPULARITY_DESC", page = 1, perPage = 24,
  } = filters;

  const data = await gql<{ Page: { media: AniListMedia[]; pageInfo: PageInfo } }>(`
    query (
      $query: String, $genre: String, $tag: String, $format: MediaFormat,
      $status: MediaStatus, $season: MediaSeason, $year: Int,
      $sort: [MediaSort], $page: Int, $perPage: Int
    ) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total hasNextPage currentPage lastPage }
        media(
          search: $query, genre: $genre, tag: $tag, format: $format,
          status: $status, season: $season, seasonYear: $year,
          type: ANIME, sort: $sort, isAdult: false
        ) { ${MEDIA_FIELDS} }
      }
    }
  `, {
    query: query || undefined,
    genre: genre || undefined,
    tag: tag || undefined,
    format: format || undefined,
    status: status || undefined,
    season: season || undefined,
    year: year || undefined,
    sort: [sort],
    page, perPage,
  }, { ttl: 3 * 60 * 1000 });

  return data.Page;
}

// ── Airing schedule (for the Schedule page) ───────────────────────────────
export interface AiringScheduleEntry {
  id: number;
  episode: number;
  airingAt: number; // unix seconds
  media: AniListMedia;
}

export async function getAiringSchedule(startUnix: number, endUnix: number, perPage = 50) {
  const data = await gql<{ Page: { airingSchedules: AiringScheduleEntry[] } }>(`
    query ($start: Int, $end: Int, $perPage: Int) {
      Page(perPage: $perPage) {
        airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
          id episode airingAt
          media { ${MEDIA_FIELDS} }
        }
      }
    }
  `, { start: startUnix, end: endUnix, perPage }, { ttl: 5 * 60 * 1000 });
  return data.Page.airingSchedules;
}

// ── Cache stats (handy for a health-check / debug endpoint) ───────────────
export function getCacheStats() {
  return { cachedEntries: cache.size, inFlightRequests: inFlight.size };
}
