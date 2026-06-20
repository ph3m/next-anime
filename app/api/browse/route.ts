import { NextRequest, NextResponse } from "next/server";
import { browseAnime, type BrowseSort } from "@/lib/anilist";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || undefined;
  const genre = searchParams.get("genre") || undefined;
  const tag = searchParams.get("theme") || undefined;
  const format = searchParams.get("type") || undefined;
  const status = searchParams.get("status") || undefined;
  const season = searchParams.get("season") || undefined;
  const yearStr = searchParams.get("year");
  const year = yearStr ? parseInt(yearStr) : undefined;
  const sort = (searchParams.get("sort") as BrowseSort) || "POPULARITY_DESC";
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("perPage") || "24");

  try {
    const result = await browseAnime({
      query, genre, tag, format: format?.toUpperCase(), status: status?.toUpperCase(),
      season: season?.toUpperCase(), year, sort, page, perPage,
    });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=180, stale-while-revalidate=600" },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err), media: [], pageInfo: {} }, { status: 500 });
  }
}
