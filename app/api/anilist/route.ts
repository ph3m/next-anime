import { NextRequest, NextResponse } from "next/server";
import { searchAnime, getTrending, getPopular, getSeasonal } from "@/lib/anilist";

// Wrap a JSON response with Cache-Control so CDNs / the browser can absorb
// repeat concurrent requests for the same data without re-hitting this route
// (and therefore without re-hitting AniList). `s-maxage` is honored by CDNs
// (Vercel, Cloudflare, etc); `stale-while-revalidate` lets a slightly stale
// response be served instantly while a fresh one is fetched in the background.
function cached(body: unknown, maxAgeSec: number, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": `public, s-maxage=${maxAgeSec}, stale-while-revalidate=${maxAgeSec * 4}`,
    },
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const mode = searchParams.get("mode") || "trending";
  const page = parseInt(searchParams.get("page") || "1");

  try {
    if (q) {
      const result = await searchAnime(q, page);
      return cached(result, 60); // search results: short cache, content changes per-term
    }
    if (mode === "popular") {
      const media = await getPopular(page);
      return cached({ media, pageInfo: {} }, 300);
    }
    if (mode === "seasonal") {
      const now = new Date();
      const month = now.getMonth();
      const seasons = ["WINTER", "SPRING", "SUMMER", "FALL"];
      const season = seasons[Math.floor(month / 3)];
      const media = await getSeasonal(season, now.getFullYear(), page);
      return cached({ media, pageInfo: {} }, 300);
    }
    // Default: trending
    const media = await getTrending(page);
    return cached({ media, pageInfo: {} }, 300);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
