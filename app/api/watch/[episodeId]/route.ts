import { NextRequest, NextResponse } from "next/server";
import { getHiAnimeStream } from "@/lib/hianime";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ episodeId: string }> }
) {
  const { episodeId } = await params;
  const { searchParams } = new URL(req.url);
  const category = (searchParams.get("category") || "sub") as "sub" | "dub" | "raw";
  const decoded = decodeURIComponent(episodeId);

  const stream = await getHiAnimeStream(decoded, category);
  if (!stream) return NextResponse.json({ error: "No stream found", sources: [] }, { status: 404 });
  return NextResponse.json(stream);
}
