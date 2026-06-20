"use client";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { AniListMedia, PageInfo } from "@/lib/anilist";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import {
  GENRES_FLAT, THEMES_FLAT, TYPES, TYPE_TO_FORMAT,
  STATUS_OPTIONS, SEASON_OPTIONS, SORT_OPTIONS, currentYearList,
} from "@/lib/constants";

// ─── Anime card (same visual language as the homepage) ───────────────────────
function AnimeCard({ anime }: { anime: AniListMedia }) {
  const title = anime.title.english || anime.title.romaji;
  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
  return (
    <Link href={`/anime/${anime.id}`}>
      <div style={{ background: "var(--surface)", borderRadius: 10, overflow: "hidden", cursor: "pointer", transition: "transform 0.2s ease" }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-5px)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; }}>
        <div style={{ position: "relative", aspectRatio: "2/3", background: "var(--bg2)" }}>
          <img src={anime.coverImage.large} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={e => { (e.target as HTMLImageElement).style.opacity = "0"; }} />
          {anime.format && (
            <span style={{ position: "absolute", top: 6, left: 6, background: "var(--accent)", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 5px", borderRadius: 4 }}>{anime.format}</span>
          )}
          {score && (
            <span style={{ position: "absolute", bottom: 6, right: 6, background: "rgba(0,0,0,0.85)", color: "var(--yellow)", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>⭐ {score}</span>
          )}
        </div>
        <div style={{ padding: "8px 10px 10px" }}>
          <p style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{title}</p>
          {anime.seasonYear && <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>{anime.seasonYear} · {anime.genres[0] || ""}</p>}
        </div>
      </div>
    </Link>
  );
}

function CardSkeleton() {
  return (
    <div>
      <div className="skeleton" style={{ aspectRatio: "2/3", width: "100%", borderRadius: 10 }} />
      <div className="skeleton" style={{ height: 12, width: "80%", marginTop: 8, borderRadius: 4 }} />
      <div className="skeleton" style={{ height: 10, width: "50%", marginTop: 6, borderRadius: 4 }} />
    </div>
  );
}

// ─── Styled native select ──────────────────────────────────────────────────
function FilterSelect({ value, onChange, options, placeholder, highlighted }: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  placeholder: string;
  highlighted?: boolean;
}) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          appearance: "none", WebkitAppearance: "none",
          padding: "10px 32px 10px 14px", borderRadius: 8,
          background: "var(--surface2)",
          border: `1px solid ${highlighted ? "var(--accent)" : "var(--border)"}`,
          color: highlighted ? "var(--accent2)" : "var(--text)",
          fontSize: 13.5, fontWeight: highlighted ? 700 : 500, cursor: "pointer", outline: "none",
          minWidth: 140,
        }}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <svg width="11" height="11" viewBox="0 0 10 10" fill="none" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }}>
        <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

const TYPE_OPTIONS = TYPES.map(t => ({ label: t, value: TYPE_TO_FORMAT[t] }));
const GENRE_OPTIONS = GENRES_FLAT.map(g => ({ label: g, value: g }));
const THEME_OPTIONS = THEMES_FLAT.map(t => ({ label: t, value: t }));
const SEASON_SELECT_OPTIONS = SEASON_OPTIONS.map(s => ({ label: s, value: s.toUpperCase() }));
const YEAR_OPTIONS = currentYearList(40).map(y => ({ label: String(y), value: String(y) }));

function BrowseInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") || "");
  const type = searchParams.get("type") || "";
  const status = searchParams.get("status") || "";
  const season = searchParams.get("season") || "";
  const year = searchParams.get("year") || "";
  const genre = searchParams.get("genre") || "";
  const theme = searchParams.get("theme") || "";
  const sort = searchParams.get("sort") || "POPULARITY_DESC";

  const [results, setResults] = useState<AniListMedia[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Push a filter change into the URL (keeps the page shareable/bookmarkable)
  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    router.push(`/browse?${params.toString()}`);
  }

  // Debounce the free-text title search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (q !== (searchParams.get("q") || "")) setParam("q", q);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const fetchPage = useCallback((pageNum: number, append: boolean) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (type) params.set("type", type);
    if (status) params.set("status", status);
    if (season) params.set("season", season);
    if (year) params.set("year", year);
    if (genre) params.set("genre", genre);
    if (theme) params.set("theme", theme);
    params.set("sort", sort);
    params.set("page", String(pageNum));

    if (append) setLoadingMore(true); else setLoading(true);
    fetch(`/api/browse?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        setResults(prev => append ? [...prev, ...(data.media || [])] : (data.media || []));
        setPageInfo(data.pageInfo || null);
        setPage(pageNum);
      })
      .finally(() => { setLoading(false); setLoadingMore(false); });
  }, [q, type, status, season, year, genre, theme, sort]);

  // Re-fetch from page 1 whenever any filter changes
  useEffect(() => {
    fetchPage(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, status, season, year, genre, theme, sort, searchParams.get("q")]);

  const activeFilterChips = [
    type && { label: type, key: "type" },
    status && { label: STATUS_OPTIONS.find(s => s.value === status)?.label || status, key: "status" },
    season && { label: season, key: "season" },
    year && { label: year, key: "year" },
    genre && { label: genre, key: "genre" },
    theme && { label: theme, key: "theme" },
  ].filter(Boolean) as { label: string; key: string }[];

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />
      <main style={{ maxWidth: 1320, margin: "0 auto", padding: "40px 32px 70px" }}>
        <h1 style={{ fontSize: 30, fontWeight: 900, marginBottom: 4 }}>Browse Anime</h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24 }}>
          {pageInfo?.total != null ? `${pageInfo.total.toLocaleString()} results` : "Loading…"}
        </p>

        {/* Filter bar */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
          <div style={{ position: "relative", flex: "1 1 240px", minWidth: 200 }}>
            <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} width="14" height="14" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M14.5 14.5L18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search title..."
              style={{ width: "100%", padding: "10px 12px 10px 34px", borderRadius: 8, background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 13.5, outline: "none" }}
            />
          </div>
          <FilterSelect value={type} onChange={v => setParam("type", v)} options={TYPE_OPTIONS} placeholder="All Types" highlighted={!!type} />
          <FilterSelect value={status} onChange={v => setParam("status", v)} options={STATUS_OPTIONS} placeholder="All Status" highlighted={!!status} />
          <FilterSelect value={season} onChange={v => setParam("season", v)} options={SEASON_SELECT_OPTIONS} placeholder="All Seasons" highlighted={!!season} />
          <FilterSelect value={year} onChange={v => setParam("year", v)} options={YEAR_OPTIONS} placeholder="All Years" highlighted={!!year} />
          <FilterSelect value={genre} onChange={v => setParam("genre", v)} options={GENRE_OPTIONS} placeholder="All Genres" highlighted={!!genre} />
          <FilterSelect value={theme} onChange={v => setParam("theme", v)} options={THEME_OPTIONS} placeholder="All Themes" highlighted={!!theme} />
          <FilterSelect value={sort} onChange={v => setParam("sort", v)} options={SORT_OPTIONS} placeholder="Sort" highlighted={false} />
        </div>

        {/* Active filter chips */}
        {activeFilterChips.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
            {activeFilterChips.map(chip => (
              <button key={chip.key} onClick={() => setParam(chip.key, "")} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 20,
                background: "rgba(var(--accent-rgb), 0.15)", border: "1px solid rgba(var(--accent-rgb), 0.35)",
                color: "var(--accent2)", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              }}>
                {chip.label}
                <span style={{ fontSize: 14, lineHeight: 1 }}>×</span>
              </button>
            ))}
            <button onClick={() => router.push("/browse")} style={{ fontSize: 12.5, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
              Clear all
            </button>
          </div>
        )}

        {/* Results grid */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 16 }}>
            {Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : results.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>No anime found</p>
            <p style={{ fontSize: 13.5 }}>Try adjusting or clearing your filters.</p>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 16 }}>
              {results.map(a => <AnimeCard key={a.id} anime={a} />)}
            </div>

            {/* Load more + counter */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginTop: 36 }}>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Showing {results.length} out of {pageInfo?.total ?? results.length} results
              </p>
              {pageInfo?.hasNextPage && (
                <button
                  onClick={() => fetchPage(page + 1, true)}
                  disabled={loadingMore}
                  style={{
                    padding: "11px 32px", borderRadius: 8, border: "1px solid var(--border)",
                    background: "var(--surface2)", color: "var(--text)", fontSize: 14, fontWeight: 600,
                    cursor: loadingMore ? "default" : "pointer", opacity: loadingMore ? 0.6 : 1,
                  }}
                >
                  {loadingMore ? "Loading…" : "+ View more"}
                </button>
              )}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
        Loading…
      </div>
    }>
      <BrowseInner />
    </Suspense>
  );
}
