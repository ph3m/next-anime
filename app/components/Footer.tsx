"use client";
import Link from "next/link";
import Image from "next/image";

// Shared site footer — rendered on every page (home, browse, schedule, and
// anime detail) so navigation/legal links and the brand mark are always
// reachable, not just from the homepage.
export default function Footer() {
  const year = new Date().getFullYear();
  const genreLinks = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Romance", "Sci-Fi", "Slice of Life", "Supernatural", "Sports"];
  const typeLinks = ["TV", "Movie", "OVA", "ONA", "Special"];
  const socials = [
    { label: "Twitter", href: "#", path: "M22 5.9c-.8.3-1.6.6-2.4.7.9-.5 1.5-1.4 1.8-2.4-.8.5-1.7.8-2.7 1-.8-.8-1.9-1.3-3.1-1.3-2.3 0-4.2 1.9-4.2 4.2 0 .3 0 .6.1.9-3.5-.2-6.6-1.9-8.7-4.4-.4.6-.6 1.3-.6 2.1 0 1.5.7 2.7 1.9 3.5-.7 0-1.4-.2-1.9-.5 0 2 1.5 3.7 3.4 4.1-.4.1-.8.1-1.2.1-.3 0-.6 0-.8-.1.6 1.7 2.1 3 4 3-1.5 1.2-3.4 1.9-5.4 1.9-.3 0-.7 0-1-.1 1.9 1.3 4.3 2 6.8 2 8.1 0 12.6-6.8 12.6-12.7v-.6c.9-.6 1.6-1.4 2.2-2.3z" },
    { label: "Discord", href: "#", path: "M20 4.4c-1.5-.7-3.1-1.2-4.8-1.5-.2.4-.5.9-.6 1.3-1.8-.3-3.5-.3-5.2 0-.2-.4-.4-.9-.6-1.3-1.7.3-3.3.8-4.8 1.5C1.4 8.4.7 12.4 1 16.4c1.7 1.3 3.5 2.2 5.4 2.8.4-.6.8-1.2 1.1-1.9-.6-.2-1.2-.5-1.7-.8.1-.1.3-.2.4-.3 3.2 1.5 6.7 1.5 9.9 0 .1.1.3.2.4.3-.6.3-1.1.6-1.7.8.3.7.7 1.3 1.1 1.9 1.9-.6 3.7-1.5 5.4-2.8.4-4.6-.8-8.5-2.3-12zM8.7 13.8c-.9 0-1.7-.9-1.7-1.9s.7-1.9 1.7-1.9c1 0 1.7.9 1.7 1.9s-.7 1.9-1.7 1.9zm6.6 0c-.9 0-1.7-.9-1.7-1.9s.7-1.9 1.7-1.9c1 0 1.7.9 1.7 1.9s-.7 1.9-1.7 1.9z" },
    { label: "Instagram", href: "#", path: "M12 2c-2.7 0-3.1 0-4.1.1-1.1 0-1.8.2-2.4.4-.7.3-1.2.6-1.7 1.1-.5.5-.8 1-1.1 1.7-.2.6-.4 1.3-.4 2.4C2.2 8.7 2.2 9.1 2.2 12s0 3.1.1 4.1c0 1.1.2 1.8.4 2.4.3.7.6 1.2 1.1 1.7.5.5 1 .8 1.7 1.1.6.2 1.3.4 2.4.4 1 .1 1.4.1 4.1.1s3.1 0 4.1-.1c1.1 0 1.8-.2 2.4-.4.7-.3 1.2-.6 1.7-1.1.5-.5.8-1 1.1-1.7.2-.6.4-1.3.4-2.4.1-1 .1-1.4.1-4.1s0-3.1-.1-4.1c0-1.1-.2-1.8-.4-2.4-.3-.7-.6-1.2-1.1-1.7-.5-.5-1-.8-1.7-1.1-.6-.2-1.3-.4-2.4-.4C15.1 2.2 14.7 2.2 12 2zm0 1.8c2.7 0 3 0 4 .1.9 0 1.5.2 1.8.3.5.2.8.4 1.1.7.3.3.5.6.7 1.1.1.3.3.9.3 1.8.1 1 .1 1.3.1 4s0 3-.1 4c0 .9-.2 1.5-.3 1.8-.2.5-.4.8-.7 1.1-.3.3-.6.5-1.1.7-.3.1-.9.3-1.8.3-1 .1-1.3.1-4 .1s-3 0-4-.1c-.9 0-1.5-.2-1.8-.3-.5-.2-.8-.4-1.1-.7-.3-.3-.5-.6-.7-1.1-.1-.3-.3-.9-.3-1.8-.1-1-.1-1.3-.1-4s0-3 .1-4c0-.9.2-1.5.3-1.8.2-.5.4-.8.7-1.1.3-.3.6-.5 1.1-.7.3-.1.9-.3 1.8-.3 1-.1 1.3-.1 4-.1zM12 7a5 5 0 100 10 5 5 0 000-10zm0 8.2a3.2 3.2 0 110-6.4 3.2 3.2 0 010 6.4zM17.4 5.4a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4z" },
    { label: "YouTube", href: "#", path: "M22.5 6.2c-.3-1-1-1.8-2-2-1.8-.5-9-.5-9-.5s-7.2 0-9 .5c-1 .2-1.7 1-2 2C0 8 0 12 0 12s0 4 .5 5.8c.3 1 1 1.8 2 2 1.8.5 9 .5 9 .5s7.2 0 9-.5c1-.2 1.7-1 2-2 .5-1.8.5-5.8.5-5.8s0-4-.5-5.8zM9.5 15.5v-7l6 3.5-6 3.5z" },
  ];

  return (
    <footer style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", marginTop: 60 }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "52px 32px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1.2fr", gap: 40, marginBottom: 40 }}>
          {/* Brand column */}
          <div>
            <Link href="/" style={{ display: "inline-flex" }}>
              <Image src="/logo-full.png" alt="Next Anime" width={104} height={46} style={{ height: 100, width: "auto", objectFit: "contain", marginBottom: 16 }} />
            </Link>
            <p style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 280, marginBottom: 20 }}>
              Next Anime is a free anime streaming and discovery hub — browse by genre, theme, or airing schedule, and pick up new series the moment they drop.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              {socials.map(s => (
                <a key={s.label} href={s.href} aria-label={s.label} style={{
                  width: 34, height: 34, borderRadius: 8, background: "var(--surface2)",
                  border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--text-muted)", transition: "color 0.15s, border-color 0.15s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.color = "var(--accent2)"; e.currentTarget.style.borderColor = "var(--accent)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d={s.path} /></svg>
                </a>
              ))}
            </div>
          </div>

          {/* Genres */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Genres</p>
            {genreLinks.map(g => (
              <Link key={g} href={`/browse?genre=${encodeURIComponent(g)}`}>
                <p style={{ fontSize: 13.5, color: "var(--text-muted)", marginBottom: 10, cursor: "pointer", transition: "color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--accent2)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>{g}</p>
              </Link>
            ))}
          </div>

          {/* Types */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Types</p>
            {typeLinks.map(t => (
              <Link key={t} href={`/browse?type=${encodeURIComponent(t)}`}>
                <p style={{ fontSize: 13.5, color: "var(--text-muted)", marginBottom: 10, cursor: "pointer", transition: "color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--accent2)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>{t}</p>
              </Link>
            ))}
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", textTransform: "uppercase", letterSpacing: 1, marginTop: 22, marginBottom: 16 }}>Explore</p>
            {[["Browse", "/browse"], ["Schedule", "/schedule"]].map(([label, href]) => (
              <Link key={label} href={href}>
                <p style={{ fontSize: 13.5, color: "var(--text-muted)", marginBottom: 10, cursor: "pointer", transition: "color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--accent2)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>{label}</p>
              </Link>
            ))}
          </div>

          {/* Company */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Company</p>
            {["About Us", "Contact", "DMCA", "Terms of Service", "Privacy Policy"].map(t => (
              <p key={t} style={{ fontSize: 13.5, color: "var(--text-muted)", marginBottom: 10, cursor: "pointer", transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--accent2)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>{t}</p>
            ))}
          </div>

          {/* Newsletter-ish CTA */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Stay Updated</p>
            <p style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 14 }}>
              Get notified about new episodes and seasonal premieres.
            </p>
            <form onSubmit={e => e.preventDefault()} style={{ display: "flex", gap: 8 }}>
              <input type="email" placeholder="you@email.com" style={{
                flex: 1, minWidth: 0, padding: "9px 12px", borderRadius: 7,
                background: "var(--surface2)", border: "1px solid var(--border)",
                color: "var(--text)", fontSize: 13, outline: "none",
              }} />
              <button type="submit" style={{
                padding: "9px 14px", borderRadius: 7, background: "var(--accent)",
                color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", flexShrink: 0,
              }}>Join</button>
            </form>
          </div>
        </div>

        {/* Data source credit + legal bar */}
        <div style={{ borderTop: "1px solid var(--border)", padding: "20px 0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <p style={{ fontSize: 12.5, color: "var(--text-dim)" }}>© {year} Next Anime. All rights reserved. Anime data via AniList API.</p>
          <div style={{ display: "flex", gap: 20 }}>
            <p style={{ fontSize: 12.5, color: "var(--text-dim)", cursor: "pointer" }}>Privacy Policy</p>
            <p style={{ fontSize: 12.5, color: "var(--text-dim)", cursor: "pointer" }}>Terms</p>
            <p style={{ fontSize: 12.5, color: "var(--text-dim)", cursor: "pointer" }}>DMCA</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
