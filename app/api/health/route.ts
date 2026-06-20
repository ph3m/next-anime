import { NextResponse } from "next/server";
import { getCacheStats } from "@/lib/anilist";

// Lightweight operational endpoint — lets you confirm the in-memory cache
// and request-coalescing layer are actually absorbing traffic in production
// (cachedEntries growing, inFlightRequests staying low under load).
export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    cache: getCacheStats(),
  }, { headers: { "Cache-Control": "no-store" } });
}
