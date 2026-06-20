import { NextRequest, NextResponse } from "next/server";
import { getAiringSchedule } from "@/lib/anilist";

// Client computes local-day boundaries (it knows the viewer's timezone) and
// sends them as unix seconds — this keeps all timezone math out of the
// server and avoids ambiguity about which "day" we're showing.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const start = parseInt(searchParams.get("start") || "0");
  const end = parseInt(searchParams.get("end") || "0");

  if (!start || !end || end <= start) {
    return NextResponse.json({ error: "Invalid start/end range", schedules: [] }, { status: 400 });
  }

  try {
    const schedules = await getAiringSchedule(start, end);
    return NextResponse.json({ schedules }, {
      headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err), schedules: [] }, { status: 500 });
  }
}
