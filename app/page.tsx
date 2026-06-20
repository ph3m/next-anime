"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { AniListMedia } from "@/lib/anilist";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// ─── Anime Card ───────────────────────────────────────────────────────────────
function AnimeCard({ anime, size = "md" }: { anime: AniListMedia; size?: "sm" | "md" }) {
  const title = anime.title.english || anime.title.romaji;
  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
  const width = size === "sm" ? 130 : 160;
  return (
    <Link href={`/anime/${anime.id}`}>
      <div style={{ width, flexShrink: 0, background: "var(--surface)", borderRadius: 10, overflow: "hidden", cursor: "pointer", transition: "transform 0.2s ease" }}
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

// ─── Hero Banner ──────────────────────────────────────────────────────────────
function HeroBanner({ media }: { media: AniListMedia[] }) {
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heroes = media.slice(0, 5).filter(m => m.bannerImage || m.coverImage.extraLarge);
  useEffect(() => {
    timerRef.current = setInterval(() => setActive(a => (a + 1) % heroes.length), 6000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [heroes.length]);
  if (!heroes.length) return null;
  const current = heroes[active];
  const title = current.title.english || current.title.romaji;
  return (
    <div style={{ position: "relative", height: 560, overflow: "hidden" }}>
      <img key={current.id} src={current.bannerImage || current.coverImage.extraLarge} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.45)", transition: "opacity 0.5s" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(13,13,20,0.95) 35%, rgba(13,13,20,0.35) 100%)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 140, background: "linear-gradient(to top, var(--bg), transparent)" }} />
      <div style={{ position: "relative", height: "100%", maxWidth: 1320, margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center" }}>
        <div style={{ flex: 1, maxWidth: 760 }}>
          <p style={{ fontSize: 13, color: "var(--accent2)", fontWeight: 700, letterSpacing: 1.8, textTransform: "uppercase", marginBottom: 16 }}>{current.format || "ANIME"} · {current.seasonYear || ""}</p>
          <h1 style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.12, marginBottom: 18, textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>{title.length > 60 ? title.slice(0, 60) + "…" : title}</h1>
          <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 20, fontSize: 15, color: "var(--text-muted)" }}>
            <span>{current.seasonYear}</span>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--text-dim)" }} />
            <span>{current.genres.slice(0, 3).join(", ")}</span>
            {current.episodes && <><span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--text-dim)" }} /><span>{current.episodes} Episodes</span></>}
          </div>
          {current.description && (
            <p style={{
              fontSize: 15, lineHeight: 1.7, color: "var(--text-muted)", marginBottom: 28,
              maxWidth: 600, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
            }} dangerouslySetInnerHTML={{ __html: current.description.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "") }} />
          )}
          <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
            <Link href={`/anime/${current.id}`}>
              <button style={{ padding: "14px 32px", borderRadius: 8, background: "var(--accent)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="14" height="16" viewBox="0 0 12 14" fill="#fff"><path d="M1 1l10 6-10 6V1z"/></svg>
                WATCH NOW
              </button>
            </Link>
            <button style={{ padding: "14px 28px", borderRadius: 8, background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.5)", cursor: "pointer", fontWeight: 600, fontSize: 15 }}>+ PLAYLIST</button>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 40 }}>
            {heroes.map((_, i) => (
              <button key={i} onClick={() => setActive(i)} style={{ width: i === active ? 28 : 8, height: 8, borderRadius: 4, border: "none", background: i === active ? "var(--accent)" : "rgba(255,255,255,0.25)", cursor: "pointer", transition: "all 0.3s", padding: 0 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section Rail ─────────────────────────────────────────────────────────────
function SectionRail({ title, subtitle, items, viewAllHref }: { title: string; subtitle?: string; items: AniListMedia[]; viewAllHref?: string }) {
  return (
    <section style={{ marginBottom: 44 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{title}</h2>
          {subtitle && <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{subtitle}</p>}
        </div>
        {viewAllHref && (
          <Link href={viewAllHref} style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
            VIEW ALL
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
        )}
      </div>
      <div className="scroll-rail">
        {items.map(a => <AnimeCard key={a.id} anime={a} />)}
      </div>
    </section>
  );
}

// ─── Top 10 + Newest Episodes ─────────────────────────────────────────────────
function Top10({ items }: { items: AniListMedia[] }) {
  return (
    <div style={{ display: "flex", gap: 40, marginBottom: 52 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>Top 10 This Week</h2>
          <div style={{ display: "flex", gap: 12 }}>
            <button style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>Animes</button>
            <button style={{ fontSize: 12, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>Mangas</button>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {items.slice(0, 10).map((a, i) => {
            const title = a.title.english || a.title.romaji;
            return (
              <Link key={a.id} href={`/anime/${a.id}`}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "10px 14px", borderRadius: 8, transition: "background 0.15s", cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--surface)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <span style={{ fontSize: i < 3 ? 28 : 18, fontWeight: 900, color: i < 3 ? "var(--accent)" : "var(--surface3)", minWidth: 32, textAlign: "center", lineHeight: 1 }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>{a.seasonYear}</p>
                    <p style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title.length > 38 ? title.slice(0, 38) + "…" : title}</p>
                    <p style={{ fontSize: 11, color: "var(--accent)", marginTop: 2 }}>{a.genres.slice(0, 2).join(", ")}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      <div style={{ width: 420, flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>Newest Animes Episodes</h2>
          <div style={{ display: "flex", gap: 10 }}>
            {["Today", "This week", "Last 30 days"].map((t, i) => (
              <button key={t} style={{ color: i === 0 ? "var(--accent)" : "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontWeight: i === 0 ? 700 : 400, fontSize: 12 }}>{t}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.slice(0, 6).map(a => {
            const title = a.title.english || a.title.romaji;
            return (
              <Link key={a.id} href={`/anime/${a.id}`}>
                <div style={{ display: "flex", gap: 12, padding: "8px", borderRadius: 8, transition: "background 0.15s", cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--surface)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <img src={a.coverImage.large} alt={title} style={{ width: 52, height: 72, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 3 }}>{a.seasonYear}</p>
                    <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{title}</p>
                    <p style={{ fontSize: 11, color: "var(--accent)", marginTop: 4 }}>{a.genres.slice(0, 2).join(", ")}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div style={{ width: 160, flexShrink: 0 }}>
      <div className="skeleton" style={{ aspectRatio: "2/3", width: "100%", borderRadius: 10 }} />
      <div className="skeleton" style={{ height: 12, width: "80%", marginTop: 8, borderRadius: 4 }} />
      <div className="skeleton" style={{ height: 10, width: "50%", marginTop: 6, borderRadius: 4 }} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [trending, setTrending] = useState<AniListMedia[]>([]);
  const [popular, setPopular] = useState<AniListMedia[]>([]);
  const [seasonal, setSeasonal] = useState<AniListMedia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/anilist?mode=trending&page=1").then(r => r.json()),
      fetch("/api/anilist?mode=popular&page=1").then(r => r.json()),
      fetch("/api/anilist?mode=seasonal&page=1").then(r => r.json()),
    ]).then(([t, p, s]) => {
      setTrending(t.media || []);
      setPopular(p.media || []);
      setSeasonal(s.media || []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />
      {!loading && trending.length > 0 && <HeroBanner media={trending} />}
      <main style={{ maxWidth: 1320, margin: "0 auto", padding: "40px 32px" }}>
        {loading ? (
          <div>
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} style={{ marginBottom: 44 }}>
                <div className="skeleton" style={{ height: 26, width: 200, borderRadius: 6, marginBottom: 16 }} />
                <div style={{ display: "flex", gap: 14 }}>
                  {Array.from({ length: 7 }).map((_, i) => <CardSkeleton key={i} />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="fade-in">
            <SectionRail title="Keep Watching" items={popular.slice(0, 10)} />
            <SectionRail title="Popular Animes to Watch Now" subtitle="Most watched animes by days" items={trending.slice(0, 12)} viewAllHref="/browse?sort=POPULARITY_DESC" />
            <Top10 items={popular} />
            <SectionRail title="Latest Releases" items={seasonal.slice(0, 10)} viewAllHref="/browse?sort=START_DATE_DESC" />
            <section style={{ marginBottom: 52 }}>
              <div style={{ background: "var(--surface)", borderRadius: 16, padding: "32px", display: "flex", gap: 32, alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>All Time Favorites</h2>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--surface3)", border: "1px solid var(--border)", color: "var(--text-muted)", cursor: "pointer", fontSize: 14 }}>‹</button>
                    <button style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--surface3)", border: "1px solid var(--border)", color: "var(--text-muted)", cursor: "pointer", fontSize: 14 }}>›</button>
                  </div>
                </div>
                <div className="scroll-rail" style={{ flex: 3 }}>
                  {[...trending, ...popular].slice(10, 20).map(a => <AnimeCard key={a.id} anime={a} size="sm" />)}
                </div>
              </div>
            </section>
            <section style={{ marginBottom: 52 }}>
              <div style={{ background: "var(--surface2)", borderRadius: 16, padding: "32px", display: "flex", gap: 32, alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Show Me Something New</h2>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--surface3)", border: "1px solid var(--border)", color: "var(--text-muted)", cursor: "pointer", fontSize: 14 }}>‹</button>
                    <button style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--surface3)", border: "1px solid var(--border)", color: "var(--text-muted)", cursor: "pointer", fontSize: 14 }}>›</button>
                  </div>
                </div>
                <div className="scroll-rail" style={{ flex: 3 }}>
                  {seasonal.slice(5, 15).map(a => <AnimeCard key={a.id} anime={a} size="sm" />)}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
