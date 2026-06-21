"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { AniListMedia } from "@/lib/anilist";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

interface Episode { number: number; title: string; episodeId: string; }

const PROVIDERS = [
  { name: "Server 1", getUrl: (_m: number, ep: number, dub: boolean, aid?: string) => `https://tryembed.us.cc/embed/anime/${aid}/${ep}/${dub ? "dub" : "sub"}` },
   { name: "Server 2", getUrl: (m: number, ep: number, dub: boolean) => `https://megaplay.buzz/stream/mal/${m}/${ep}/${dub ? "dub" : "sub"}` },
  { name: "Server 3", getUrl: (m: number, ep: number, dub: boolean) => `https://vidsrc-embed.ru/embed/anime?mal=${m}&episode=${ep}&type=${dub ? "dub" : "sub"}` },
];

function StatBox({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className="stat-box" style={{ background: "var(--surface2)", borderRadius: 12, padding: "20px 26px", flex: wide ? "0 0 auto" : 1, minWidth: wide ? 190 : 120 }}>
      <p style={{ fontSize: 11.5, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1.3, marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>{value}</p>
    </div>
  );
}

// ─── Trailer component with play-to-embed ────────────────────────────────────
function TrailerBox({ trailer, title }: { trailer: { id: string; site: string } | null; title: string }) {
  const [playing, setPlaying] = useState(false);
  if (!trailer?.id) return null;

  const isYT = trailer.site?.toLowerCase() === "youtube";
  const thumbUrl = isYT
    ? `https://img.youtube.com/vi/${trailer.id}/mqdefault.jpg`
    : null;

  return (
    <div style={{ background: "var(--surface)", borderRadius: 14, padding: "20px 24px", marginBottom: 20 }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1.3, marginBottom: 12 }}>TRAILER</p>
      <div style={{ borderRadius: 10, overflow: "hidden", position: "relative", aspectRatio: "16/9" }}>
        {playing ? (
          <iframe
            src={isYT
              ? `https://www.youtube.com/embed/${trailer.id}?autoplay=1&rel=0`
              : `https://www.youtube.com/embed/${trailer.id}?autoplay=1`}
            style={{ width: "100%", height: "100%", border: "none" }}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div style={{ position: "relative", width: "100%", height: "100%", cursor: "pointer" }} onClick={() => setPlaying(true)}>
            {thumbUrl ? (
              <img src={thumbUrl} alt="Trailer thumbnail" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", background: "var(--bg2)" }} />
            )}
            {/* Overlay */}
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.38)", transition: "background 0.2s" }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 24px rgba(var(--accent-rgb), 0.45)" }}>
                <svg width="20" height="22" viewBox="0 0 12 14" fill="#fff"><path d="M1 1l10 6-10 6V1z"/></svg>
              </div>
              <p style={{ color: "#fff", fontSize: 12, fontWeight: 600, marginTop: 10, opacity: 0.9 }}>PLAY TRAILER</p>
            </div>
            {/* Bottom label */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "8px 12px", background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)", fontSize: 11, color: "#fff", fontWeight: 600 }}>
              {title.toUpperCase().slice(0, 40)} / MAIN TRAILER
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AnimeDetailClient({ anime, id }: { anime: AniListMedia; id: string }) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [malId, setMalId] = useState<number | null>(null);
  const [activeEp, setActiveEp] = useState<number>(1);
  const [provider, setProvider] = useState(0);
  const [dub, setDub] = useState(false);
  const [epLoading, setEpLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [epPage, setEpPage] = useState(0);
  const EP_PER_PAGE = 20;

  useEffect(() => {
    if (!id) return;
    fetch(`/api/episodes/${id}`)
      .then(r => r.json())
      .then(data => { setEpisodes(data.episodes || []); setMalId(data.malId || null); })
      .finally(() => setEpLoading(false));
  }, [id]);

  const embedUrl = malId ? PROVIDERS[provider].getUrl(malId, activeEp, dub, id) : null;

  const title = anime.title.english || anime.title.romaji;
  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
  const releaseDate = anime.seasonYear ? `${anime.season ? anime.season + " " : ""}${anime.seasonYear}` : "N/A";
  const tags = [...(anime.genres || []).map(g => ({ label: g, type: "genre" })), { label: anime.format || "ANIME", type: "format" }];

  const totalEpPages = Math.ceil(episodes.length / EP_PER_PAGE);
  const visibleEps = episodes.slice(epPage * EP_PER_PAGE, (epPage + 1) * EP_PER_PAGE);

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />

      {/* ── Banner ── */}
      <div className="detail-banner" style={{ position: "relative", height: 460, overflow: "hidden" }}>
        {anime.bannerImage ? (
          <img src={anime.bannerImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.55)" }} />
        ) : (
          <img src={anime.coverImage.extraLarge || anime.coverImage.large} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", filter: "brightness(0.4) blur(2px)" }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 25%, var(--bg) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(13,13,13,0.7) 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", bottom: 28, left: 32, right: 32, maxWidth: 1320, margin: "0 auto" }}>
          {anime.title.romaji !== title && <p style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600, letterSpacing: 1.6, textTransform: "uppercase", marginBottom: 8 }}>{anime.title.romaji}</p>}
          <h1 className="detail-title" style={{ fontSize: 48, fontWeight: 900, lineHeight: 1.12, textShadow: "0 2px 20px rgba(0,0,0,0.6)", marginBottom: 14 }}>{title}</h1>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {tags.slice(0, 4).map(t => (
              <span key={t.label} style={{ padding: "5px 14px", borderRadius: 5, fontSize: 13, fontWeight: 600, background: t.type === "format" ? "rgba(255,255,255,0.15)" : "rgba(var(--accent-rgb), 0.18)", color: t.type === "format" ? "#fff" : "var(--accent2)", border: `1px solid ${t.type === "format" ? "rgba(255,255,255,0.2)" : "rgba(var(--accent-rgb), 0.3)"}` }}>{t.label}</span>
            ))}
          </div>
        </div>
      </div>

      <main className="page-pad" style={{ maxWidth: 1320, margin: "0 auto", padding: "0 32px 70px" }}>
        {/* ── Stat row ── */}
        <div className="stat-row" style={{ display: "flex", gap: 14, marginTop: -24, marginBottom: 40, position: "relative", zIndex: 10, flexWrap: "wrap" }}>
          <Link href={`/anime/${id}`}>
            <div className="play-btn" style={{ width: 88, height: 88, borderRadius: 12, background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "opacity 0.2s", flexShrink: 0 }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="#fff"><path d="M5 3l14 9-14 9V3z"/></svg>
            </div>
          </Link>
          <StatBox label="STATUS" value={anime.status?.replace(/_/g, " ") || "N/A"} />
          <StatBox label="EPISODES" value={String(anime.episodes || "?")} />
          <StatBox label="RELEASE" value={releaseDate} wide />
          <StatBox label="LENGTH" value={`${anime.duration || 24} min`} />
        </div>

        {/* ── Two-column layout ── */}
        <div className="detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 48 }}>
          {/* Left */}
          <div>
            {anime.description && (
              <section style={{ marginBottom: 40 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1.3, marginBottom: 10 }}>DESCRIPTION</p>
                <p style={{ lineHeight: 1.85, color: "var(--text)", fontSize: 16 }} dangerouslySetInnerHTML={{ __html: anime.description?.replace(/<br\s*\/?>/gi, " ") || "" }} />
              </section>
            )}

            {/* Player */}
            <section style={{ marginBottom: 40 }}>
              <div className="player-controls" style={{ display: "flex", gap: 2, marginBottom: 16, flexWrap: "wrap", rowGap: 8 }}>
                {PROVIDERS.map((p, i) => (
                  <button key={p.name} onClick={() => { setProvider(i); setIframeKey(k => k + 1); }}
                    style={{ padding: "9px 18px", border: "none", background: provider === i ? "var(--accent)" : "var(--surface2)", color: provider === i ? "#fff" : "var(--text-muted)", cursor: "pointer", fontSize: 13.5, fontWeight: 600, borderRadius: i === 0 ? "8px 0 0 8px" : i === PROVIDERS.length - 1 ? "0 8px 8px 0" : "0" }}>
                    {p.name}
                  </button>
                ))}
                <div className="player-spacer" style={{ flex: 1 }} />
                {["Sub", "Dub"].map(t => (
                  <button key={t} onClick={() => { setDub(t === "Dub"); setIframeKey(k => k + 1); }}
                    style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid", borderColor: (dub ? "Dub" : "Sub") === t ? "var(--accent)" : "var(--border)", background: (dub ? "Dub" : "Sub") === t ? "rgba(var(--accent-rgb), 0.15)" : "transparent", color: (dub ? "Dub" : "Sub") === t ? "var(--accent)" : "var(--text-muted)", cursor: "pointer", fontSize: 13.5, fontWeight: 700, marginLeft: 4 }}>
                    {t}
                  </button>
                ))}
              </div>
              <div style={{ width: "100%", aspectRatio: "16/9", background: "#000", borderRadius: 14, overflow: "hidden", position: "relative" }}>
                {!malId ? (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, color: "var(--text-muted)" }}>
                    <div style={{ fontSize: 40 }}>⚠️</div>
                    <p style={{ fontSize: 15 }}>Cannot load player — no MAL ID found</p>
                  </div>
                ) : (
                  <iframe key={`${iframeKey}-${activeEp}-${provider}-${dub}`} src={embedUrl || ""} style={{ width: "100%", height: "100%", border: "none" }} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
                )}
              </div>
              {malId && <p style={{ fontSize: 12.5, color: "var(--text-dim)", marginTop: 10 }}>If the video doesn&apos;t load, try switching servers above.</p>}
            </section>

            {/* Episodes */}
            <section>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1.3 }}>
                  EPISODES {epLoading ? "" : `(${episodes.length})`}
                </p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {["Crunchyroll", "GoGoAnime", "Aniwatch", "VidSrc (unstable)"].map((s, i) => (
                    <button key={s} style={{ fontSize: 12.5, padding: "3px 0", background: "none", border: "none", color: i === 1 ? "var(--accent)" : "var(--text-muted)", cursor: "pointer", fontWeight: i === 1 ? 700 : 400 }}>{s}{i < 3 ? " |" : ""}</button>
                  ))}
                </div>
              </div>
              {epLoading ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {Array.from({ length: 20 }).map((_, i) => <div key={i} className="skeleton" style={{ width: 60, height: 48, borderRadius: 9 }} />)}
                </div>
              ) : episodes.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: 15, padding: "24px 0" }}>Episode list unavailable for this title.</p>
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))", gap: 8, marginBottom: 16 }}>
                    {visibleEps.map(ep => {
                      const isActive = activeEp === ep.number;
                      return (
                        <button key={ep.number} onClick={() => { setActiveEp(ep.number); setIframeKey(k => k + 1); }}
                          style={{ padding: "13px 4px", borderRadius: 9, border: "1px solid", borderColor: isActive ? "var(--accent)" : "var(--border)", background: isActive ? "var(--accent)" : "var(--surface)", color: isActive ? "#fff" : "var(--text-muted)", cursor: "pointer", fontSize: 14.5, fontWeight: isActive ? 700 : 500, transition: "all 0.15s" }}
                          onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)"; } }}
                          onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; } }}>
                          {ep.number}
                        </button>
                      );
                    })}
                  </div>
                  {totalEpPages > 1 && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {Array.from({ length: totalEpPages }).map((_, i) => (
                        <button key={i} onClick={() => setEpPage(i)}
                          style={{ padding: "6px 13px", borderRadius: 7, border: "1px solid", borderColor: epPage === i ? "var(--accent)" : "var(--border)", background: epPage === i ? "var(--accent)" : "var(--surface)", color: epPage === i ? "#fff" : "var(--text-muted)", cursor: "pointer", fontSize: 12.5, fontWeight: 600 }}>
                          {i * EP_PER_PAGE + 1}–{Math.min((i + 1) * EP_PER_PAGE, episodes.length)}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </section>
          </div>

          {/* Right sidebar */}
          <div>
            {score && (
              <div style={{ background: "var(--surface)", borderRadius: 14, padding: "20px 24px", marginBottom: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1.3, marginBottom: 12 }}>SCORE</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 8, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#fff" }}>AL</div>
                  <div>
                    <div style={{ display: "flex", gap: 2, marginBottom: 3 }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} style={{ color: i < Math.round(parseFloat(score) / 2) ? "var(--yellow)" : "var(--surface3)", fontSize: 17 }}>★</span>
                      ))}
                    </div>
                    <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>({(parseFloat(score) / 2).toFixed(2)}/5)</p>
                  </div>
                  <div style={{ marginLeft: "auto", background: "#f5c518", color: "#000", borderRadius: 6, padding: "6px 11px", fontWeight: 900, fontSize: 15 }}>
                    <span style={{ fontSize: 10, fontWeight: 400, display: "block", lineHeight: 1 }}>IMDb</span>
                    {score}/10
                  </div>
                </div>
              </div>
            )}

            {/* Trailer — now plays inline */}
            <TrailerBox trailer={anime.trailer} title={title} />

            {/* More Info */}
            <div style={{ background: "var(--surface)", borderRadius: 14, padding: "20px 24px" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1.3, marginBottom: 16 }}>MORE INFO</p>
              {[
                ["Status", anime.status?.replace(/_/g, " ") || "—"],
                ["Studio", anime.studios?.nodes?.[0]?.name || "—"],
                ["Season", anime.season && anime.seasonYear ? `${anime.season} ${anime.seasonYear}` : "—"],
                ["Episodes", String(anime.episodes || "?")],
                ["Genres", anime.genres.slice(0, 3).join(", ")],
                ["Hashtag", `#${(title).replace(/\s+/g, "_").slice(0, 20)}`],
              ].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 13, paddingBottom: 13, borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 14, color: "var(--text-muted)", flexShrink: 0 }}>{l}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, textAlign: "right", color: l === "Hashtag" ? "var(--accent)" : "var(--text)" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
