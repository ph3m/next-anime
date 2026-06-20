"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import type { AiringScheduleEntry } from "@/lib/anilist";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

const WEEKDAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface DayEntry { offset: number; date: Date; label: string; dayNum: number; monthAbbr: string; }

function buildDayStrip(): DayEntry[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days: DayEntry[] = [];
  for (let offset = -3; offset <= 10; offset++) {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    let label: string;
    if (offset === -1) label = "YESTERDAY";
    else if (offset === 0) label = "TODAY";
    else if (offset === 1) label = "TOMORROW";
    else label = WEEKDAY_ABBR[d.getDay()].toUpperCase();
    days.push({ offset, date: d, label, dayNum: d.getDate(), monthAbbr: MONTH_ABBR[d.getMonth()] });
  }
  return days;
}

function timeOfDayBucket(hour: number): string {
  if (hour >= 5 && hour < 12) return "MORNING";
  if (hour >= 12 && hour < 17) return "AFTERNOON";
  if (hour >= 17 && hour < 21) return "EVENING";
  return "NIGHT";
}

function formatTime(date: Date) {
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default function SchedulePage() {
  const [selectedOffset, setSelectedOffset] = useState(0);
  const [schedules, setSchedules] = useState<AiringScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState<Date | null>(null);

  const dayStrip = useMemo(() => buildDayStrip(), []);
  const timeZone = useMemo(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return "Local"; }
  }, []);

  // Live clock in the corner
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Fetch schedule for the selected day (local-day boundaries computed client-side)
  useEffect(() => {
    const selected = dayStrip.find(d => d.offset === selectedOffset)!;
    const start = new Date(selected.date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(selected.date);
    end.setHours(23, 59, 59, 999);

    setLoading(true);
    fetch(`/api/schedule?start=${Math.floor(start.getTime() / 1000)}&end=${Math.floor(end.getTime() / 1000)}`)
      .then(r => r.json())
      .then(data => setSchedules(data.schedules || []))
      .finally(() => setLoading(false));
  }, [selectedOffset, dayStrip]);

  // Group by time-of-day bucket, in chronological order
  const grouped = useMemo(() => {
    const buckets: Record<string, AiringScheduleEntry[]> = { MORNING: [], AFTERNOON: [], EVENING: [], NIGHT: [] };
    for (const s of schedules) {
      const d = new Date(s.airingAt * 1000);
      buckets[timeOfDayBucket(d.getHours())].push(s);
    }
    return buckets;
  }, [schedules]);

  const selectedDay = dayStrip.find(d => d.offset === selectedOffset)!;
  const isPast = (airingAt: number) => now && airingAt * 1000 < now.getTime();

  const selectedDayLabel = selectedDay.offset === 0
    ? `Today — ${selectedDay.date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}`
    : selectedDay.date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />
      <main style={{ maxWidth: 1320, margin: "0 auto", padding: "40px 32px 70px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 30, fontWeight: 900, marginBottom: 4 }}>Airing Schedule</h1>
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Episode release times in your local timezone</p>
          </div>
          {now && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 16px", display: "flex", gap: 10, alignItems: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: "var(--accent)" }}>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700 }}>{now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} at {formatTime(now)}</p>
                <p style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{timeZone}</p>
              </div>
            </div>
          )}
        </div>

        {/* Day strip */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 28 }} className="scroll-rail">
          {dayStrip.map(d => {
            const active = d.offset === selectedOffset;
            return (
              <button key={d.offset} onClick={() => setSelectedOffset(d.offset)} style={{
                flexShrink: 0, minWidth: 76, padding: "10px 6px", borderRadius: 10,
                border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                background: active ? "var(--accent)" : "var(--surface)",
                color: active ? "#fff" : "var(--text-muted)",
                cursor: "pointer", textAlign: "center", transition: "all 0.15s",
              }}>
                <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5 }}>{d.label}</p>
                <p style={{ fontSize: 19, fontWeight: 800, marginTop: 2 }}>{d.dayNum}</p>
                <p style={{ fontSize: 10, opacity: 0.85 }}>{d.monthAbbr}</p>
              </button>
            );
          })}
        </div>

        {/* Selected day heading */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>{selectedDayLabel}</h2>
          {!loading && <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{schedules.length} episode{schedules.length === 1 ? "" : "s"}</span>}
        </div>

        {/* Episode list grouped by time of day */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 76, borderRadius: 10 }} />
            ))}
          </div>
        ) : schedules.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
            <p style={{ fontSize: 16, fontWeight: 600 }}>No episodes scheduled for this day</p>
          </div>
        ) : (
          ["MORNING", "AFTERNOON", "EVENING", "NIGHT"].map(bucket => {
            const entries = grouped[bucket];
            if (!entries.length) return null;
            return (
              <div key={bucket} style={{ marginBottom: 28 }}>
                <p style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-muted)", letterSpacing: 1.3, marginBottom: 12, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>{bucket}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {entries.map(entry => {
                    const airDate = new Date(entry.airingAt * 1000);
                    const title = entry.media.title.english || entry.media.title.romaji;
                    const past = isPast(entry.airingAt);
                    return (
                      <Link key={entry.id} href={`/anime/${entry.media.id}`}>
                        <div style={{
                          display: "flex", alignItems: "center", gap: 16, padding: "12px 16px",
                          background: "var(--surface)", borderRadius: 10, cursor: "pointer", transition: "background 0.15s",
                        }}
                          onMouseEnter={e => (e.currentTarget.style.background = "var(--surface2)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "var(--surface)")}
                        >
                          <div style={{ width: 64, textAlign: "center", flexShrink: 0 }}>
                            <p style={{ fontSize: 13.5, fontWeight: 700 }}>{formatTime(airDate)}</p>
                          </div>
                          <img src={entry.media.coverImage.large} alt={title} style={{ width: 44, height: 60, objectFit: "cover", borderRadius: 6, flexShrink: 0, background: "var(--bg2)" }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 14.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</p>
                            <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>Episode {entry.episode}</p>
                          </div>
                          <span style={{
                            padding: "4px 11px", borderRadius: 20, fontSize: 11.5, fontWeight: 700, flexShrink: 0,
                            background: past ? "var(--surface3)" : "rgba(var(--accent-rgb), 0.15)",
                            color: past ? "var(--text-muted)" : "var(--accent2)",
                          }}>
                            {past ? "Aired" : "Upcoming"}
                          </span>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "var(--text-dim)", flexShrink: 0 }}>
                            <path d="M5 2.5L9.5 7L5 11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </main>
      <Footer />
    </div>
  );
}
