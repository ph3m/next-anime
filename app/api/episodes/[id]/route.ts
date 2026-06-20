import { NextRequest, NextResponse } from "next/server";
import { getEpisodeMeta } from "@/lib/anilist";

// Episode count + MAL id, now routed through the shared cached/coalesced
// AniList client instead of an uncached raw fetch — repeat visits to the
// same anime no longer cost a fresh network round trip.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const media = await getEpisodeMeta(parseInt(id));
    if (!media) return NextResponse.json({ episodes: [], malId: null });

    const count = media.episodes || 0;
    const malId = media.idMal;

    const episodes = Array.from({ length: count }, (_, i) => ({
      number: i + 1,
      title: `Episode ${i + 1}`,
      episodeId: String(i + 1),
    }));

    return NextResponse.json({ episodes, malId, title: media.title }, {
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800" },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err), episodes: [], malId: null }, { status: 500 });
  }
}
