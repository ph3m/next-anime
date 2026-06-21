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
const HERO_AUTOPLAY_MS = 6000;

function HeroBanner({ media }: { media: AniListMedia[] }) {
  const heroes = media.slice(0, 5).filter(m => m.bannerImage || m.coverImage.extraLarge);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [cycleKey, setCycleKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const count = heroes.length;
  const goTo = (i: number) => {
    setActive(((i % count) + count) % count);
    setCycleKey(k => k + 1);
  };
  const next = () => goTo(active + 1);
  const prev = () => goTo(active - 1);

  // Respect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Pause autoplay when the browser tab isn't visible
  useEffect(() => {
    const handler = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  // Autoplay — resets automatically whenever `active` changes, whether from
  // the timer itself, arrows, dots, swipe, or keyboard nav.
  useEffect(() => {
    if (count < 2 || paused || tabHidden || reducedMotion) return;
    timeoutRef.current = setTimeout(() => { setActive(a => (a + 1) % count); setCycleKey(k => k + 1); }, HERO_AUTOPLAY_MS);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [active, paused, tabHidden, reducedMotion, count]);

  // Keyboard navigation (ignored while typing in an input/select/textarea)
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      if (["input", "textarea", "select"].includes(tag)) return;
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, count]);

  function onTouchStart(e: React.TouchEvent) {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStartRef.current;
    if (!start) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    touchStartRef.current = null;
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return; // mostly-vertical or too-short swipe = ignore
    if (dx < 0) next(); else prev();
  }

  if (!count) return null;
  const current = heroes[active];
  const title = current.title.english || current.title.romaji;

  return (
    <div
      ref={containerRef}
      className="hero-banner"
      style={{ position: "relative", height: 560, overflow: "hidden" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="region"
      aria-label="Featured anime"
    >
      {/* Stacked slides — true crossfade via opacity, no remount/jump-cut */}
      {heroes.map((hero, i) => {
        const isActive = i === active;
        return (
          <div key={hero.id} style={{
            position: "absolute", inset: 0,
            opacity: isActive ? 1 : 0,
            transition: "opacity 1s ease",
            zIndex: isActive ? 1 : 0,
            pointerEvents: "none",
            overflow: "hidden",
          }}>
            <img
              key={isActive ? `${hero.id}-${cycleKey}` : hero.id}
              src={hero.bannerImage || hero.coverImage.extraLarge}
              alt=""
              className={isActive && !reducedMotion ? "hero-kenburns" : ""}
              style={{
                width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.45)",
                animation: isActive && !reducedMotion ? `heroKenBurns ${HERO_AUTOPLAY_MS + 1000}ms ease-out forwards` : "none",
              }}
            />
          </div>
        );
      })}

      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(13,13,20,0.95) 35%, rgba(13,13,20,0.35) 100%)", zIndex: 2 }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 140, background: "linear-gradient(to top, var(--bg), transparent)", zIndex: 2 }} />

      {/* Prev / Next arrows */}
      {count > 1 && (
        <>
          <button aria-label="Previous slide" onClick={prev} className="hero-arrow" style={{
            position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", zIndex: 5,
            width: 44, height: 44, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.25)",
            background: "rgba(13,13,13,0.45)", color: "#fff", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.2s, border-color 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(var(--accent-rgb), 0.55)"; e.currentTarget.style.borderColor = "var(--accent)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(13,13,13,0.45)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 4l-9 8 9 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button aria-label="Next slide" onClick={next} className="hero-arrow" style={{
            position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)", zIndex: 5,
            width: 44, height: 44, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.25)",
            background: "rgba(13,13,13,0.45)", color: "#fff", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.2s, border-color 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(var(--accent-rgb), 0.55)"; e.currentTarget.style.borderColor = "var(--accent)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(13,13,13,0.45)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 4l9 8-9 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </>
      )}

      <div className="hero-content" style={{ position: "relative", height: "100%", maxWidth: 1320, margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", zIndex: 3 }}>
        <div key={active} className={reducedMotion ? "" : "hero-text-anim"} style={{ flex: 1, maxWidth: 760, animation: reducedMotion ? "none" : "heroTextIn 0.5s ease both" }}>
          <p className="hero-meta" style={{ fontSize: 13, color: "var(--accent2)", fontWeight: 700, letterSpacing: 1.8, textTransform: "uppercase", marginBottom: 16 }}>{current.format || "ANIME"} · {current.seasonYear || ""}</p>
          <h1 className="hero-title" style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.12, marginBottom: 18, textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>{title.length > 60 ? title.slice(0, 60) + "…" : title}</h1>
          <div className="hero-meta" style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 20, fontSize: 15, color: "var(--text-muted)", flexWrap: "wrap" }}>
            <span>{current.seasonYear}</span>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--text-dim)" }} />
            <span>{current.genres.slice(0, 3).join(", ")}</span>
            {current.episodes && <><span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--text-dim)" }} /><span>{current.episodes} Episodes</span></>}
          </div>
          {current.description && (
            <p className="hero-desc" style={{
              fontSize: 15, lineHeight: 1.7, color: "var(--text-muted)", marginBottom: 28,
              maxWidth: 600, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
            }} dangerouslySetInnerHTML={{ __html: current.description.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "") }} />
          )}
          <div className="hero-actions" style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
            <Link href={`/anime/${current.id}`}>
              <button style={{ padding: "14px 32px", borderRadius: 8, background: "var(--accent)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="14" height="16" viewBox="0 0 12 14" fill="#fff"><path d="M1 1l10 6-10 6V1z"/></svg>
                WATCH NOW
              </button>
            </Link>
            <button style={{ padding: "14px 28px", borderRadius: 8, background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.5)", cursor: "pointer", fontWeight: 600, fontSize: 15 }}>+ PLAYLIST</button>
          </div>

          {/* Progress-bar indicators (replace plain dots) */}
          {count > 1 && (
            <div style={{ display: "flex", gap: 6, marginTop: 40 }}>
              {heroes.map((h, i) => (
                <button
                  key={h.id}
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => goTo(i)}
                  style={{
                    width: 32, height: 4, borderRadius: 3, border: "none", padding: 0, cursor: "pointer",
                    background: "rgba(255,255,255,0.25)", overflow: "hidden", position: "relative",
                  }}
                >
                  {i === active && (
                    <span
                      key={cycleKey}
                      className={(!paused && !tabHidden && !reducedMotion) ? "hero-progress-fill" : ""}
                      style={{
                        position: "absolute", inset: 0, background: "var(--accent)", borderRadius: 3,
                        width: (paused || tabHidden) ? "100%" : undefined,
                        animation: (!paused && !tabHidden && !reducedMotion) ? `heroProgressFill ${HERO_AUTOPLAY_MS}ms linear forwards` : "none",
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          )}
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
    <div className="top10-row" style={{ display: "flex", gap: 40, marginBottom: 52 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
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
      <div style={{ width: 420, maxWidth: "100%", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
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
      <main className="page-pad" style={{ maxWidth: 1320, margin: "0 auto", padding: "40px 32px" }}>
        {loading ? (
          <div>
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} style={{ marginBottom: 44 }}>
                <div className="skeleton" style={{ height: 26, width: 200, borderRadius: 6, marginBottom: 16 }} />
                <div className="scroll-rail">
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
              <div className="favorites-panel" style={{ background: "var(--surface)", borderRadius: 16, padding: "32px", display: "flex", gap: 32, alignItems: "center" }}>
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
              <div className="favorites-panel" style={{ background: "var(--surface2)", borderRadius: 16, padding: "32px", display: "flex", gap: 32, alignItems: "center" }}>
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
