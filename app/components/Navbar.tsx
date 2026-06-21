"use client";
import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { AniListMedia } from "@/lib/anilist";
import { GENRES_COLS, THEMES_COLS, TYPES } from "@/lib/constants";

// ── Dropdown panel ─────────────────────────────────────────────────────────
function DropdownPanel({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div style={{
      position: "absolute", top: "calc(100% + 8px)", left: 0,
      background: "#18181f", border: "1px solid var(--border)",
      borderRadius: 10, boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
      padding: "16px 20px", zIndex: 200,
      minWidth: wide ? 640 : 160,
      animation: "fadeIn 0.15s ease",
    }}>
      {children}
    </div>
  );
}

// ── Nav item with optional dropdown ───────────────────────────────────────
function NavItem({
  label, href, dropdown, active = false,
}: {
  label: string;
  href?: string;
  dropdown?: React.ReactNode;
  active?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const highlighted = open || active;

  const inner = (
    <button
      onClick={() => dropdown && setOpen(o => !o)}
      style={{
        background: highlighted ? (active && !open ? "rgba(var(--accent-rgb), 0.14)" : "rgba(255,255,255,0.06)") : "none",
        border: highlighted ? `1px solid ${active && !open ? "rgba(var(--accent-rgb), 0.35)" : "rgba(255,255,255,0.15)"}` : "1px solid transparent",
        borderRadius: 6,
        color: active ? "var(--accent2)" : "var(--text)",
        cursor: "pointer",
        fontSize: 14,
        fontWeight: 500,
        padding: "6px 10px",
        display: "flex", alignItems: "center", gap: 4,
        transition: "background 0.15s, border-color 0.15s",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={e => { if (!highlighted) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; }}
      onMouseLeave={e => { if (!highlighted) (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
    >
      {label}
      {dropdown && (
        <svg width="11" height="11" viewBox="0 0 10 10" fill="none" style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "" }}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )}
    </button>
  );

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {href && !dropdown ? <Link href={href}>{inner}</Link> : inner}
      {open && dropdown && <DropdownPanel wide={label !== "Types" && !!dropdown}>{dropdown}</DropdownPanel>}
    </div>
  );
}

// ── Column dropdown list (for Types) ──────────────────────────────────────
function TypesDropdown({ activeType }: { activeType: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {TYPES.map(t => {
        const isSelected = activeType.toLowerCase() === t.toLowerCase();
        return (
          <Link key={t} href={`/browse?type=${encodeURIComponent(t)}`}>
            <div style={{
              padding: "7px 12px", borderRadius: 6, fontSize: 14,
              color: isSelected ? "var(--accent2)" : "var(--text-muted)",
              fontWeight: isSelected ? 700 : 400,
              cursor: "pointer", transition: "all 0.12s",
              display: "flex", alignItems: "center", gap: 6,
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = ""; }}
            >
              {isSelected && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent)" }} />}
              {t}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ── Multi-column dropdown (Genres / Themes) ────────────────────────────────
function MultiColDropdown({ cols, viewAllLabel, viewAllHref, paramName, activeValue }: {
  cols: string[][];
  viewAllLabel: string;
  viewAllHref: string;
  paramName: "genre" | "theme";
  activeValue: string;
}) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols.length}, 1fr)`, gap: "2px 32px" }}>
        {cols.map((col, ci) => (
          <div key={ci}>
            {col.map(item => {
              const isSelected = activeValue.toLowerCase() === item.toLowerCase();
              return (
                <Link key={item} href={`/browse?${paramName}=${encodeURIComponent(item)}`}>
                  <div style={{
                    padding: "6px 4px", fontSize: 14,
                    color: isSelected ? "var(--accent2)" : "var(--text-muted)",
                    fontWeight: isSelected ? 700 : 400,
                    cursor: "pointer",
                    borderRadius: 4, transition: "color 0.12s",
                    display: "flex", alignItems: "center", gap: 6,
                  }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.color = "#fff"; }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.color = "var(--text-muted)"; }}
                  >
                    {isSelected && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />}
                    {item}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid var(--border)", marginTop: 12, paddingTop: 10 }}>
        <Link href={viewAllHref}>
          <span style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600, cursor: "pointer" }}>
            {viewAllLabel} →
          </span>
        </Link>
      </div>
    </div>
  );
}

// ── Search box with live suggestions ───────────────────────────────────────
function SearchBox({ fullWidth = false, autoFocus = false }: { fullWidth?: boolean; autoFocus?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(urlQuery);
  const [suggestions, setSuggestions] = useState<AniListMedia[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingSuggestions, setSearchingSuggestions] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { if (autoFocus) inputRef.current?.focus(); }, [autoFocus]);

  // Keep input synced if the URL query changes externally (e.g. back button)
  useEffect(() => { setQuery(urlQuery); }, [urlQuery]);

  // Debounced live suggestions
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      setSearchingSuggestions(true);
      fetch(`/api/anilist?q=${encodeURIComponent(trimmed)}`)
        .then(r => r.json())
        .then(data => {
          setSuggestions((data.media || []).slice(0, 6));
          setShowSuggestions(true);
        })
        .finally(() => setSearchingSuggestions(false));
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Close suggestions on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setShowSuggestions(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function goToResults(q: string) {
    setShowSuggestions(false);
    if (q.trim()) router.push(`/browse?q=${encodeURIComponent(q.trim())}`);
    else router.push("/browse");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    goToResults(query);
  }

  function handleSelect(anime: AniListMedia) {
    setShowSuggestions(false);
    setQuery("");
    router.push(`/anime/${anime.id}`);
  }

  return (
    <div ref={wrapRef} style={{ position: "relative", width: fullWidth ? "100%" : 280, flexShrink: 0 }}>
      <form onSubmit={handleSubmit}>
        <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)", pointerEvents: "none" }}
          width="15" height="15" viewBox="0 0 20 20" fill="none">
          <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M14.5 14.5L18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { if (suggestions.length) setShowSuggestions(true); }}
          placeholder="Search anime..."
          style={{
            width: "100%", padding: "8px 14px 8px 36px",
            background: "var(--surface2)", border: "1px solid var(--border)",
            borderRadius: 8, color: "var(--text)", fontSize: 14, outline: "none",
            transition: "border-color 0.2s",
          }}
          onFocusCapture={e => (e.target.style.borderColor = "var(--accent)")}
          onBlurCapture={e => (e.target.style.borderColor = "var(--border)")}
        />
      </form>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
          background: "#18181f", border: "1px solid var(--border)",
          borderRadius: 10, boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
          zIndex: 200, overflow: "hidden", animation: "fadeIn 0.15s ease",
        }}>
          {searchingSuggestions ? (
            <div style={{ padding: "16px", fontSize: 13, color: "var(--text-muted)" }}>Searching…</div>
          ) : suggestions.length === 0 ? (
            <div style={{ padding: "16px", fontSize: 13, color: "var(--text-muted)" }}>No matches found.</div>
          ) : (
            <>
              {suggestions.map(a => {
                const t = a.title.english || a.title.romaji;
                return (
                  <div key={a.id} onClick={() => handleSelect(a)}
                    style={{ display: "flex", gap: 10, padding: "9px 12px", cursor: "pointer", alignItems: "center", transition: "background 0.12s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <img src={a.coverImage.large} alt={t} style={{ width: 32, height: 44, objectFit: "cover", borderRadius: 4, flexShrink: 0, background: "var(--bg2)" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t}</p>
                      <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{a.seasonYear || ""} {a.format ? `· ${a.format}` : ""}</p>
                    </div>
                  </div>
                );
              })}
              <div onClick={() => goToResults(query)} style={{
                padding: "10px 12px", fontSize: 12, fontWeight: 600, color: "var(--accent)",
                cursor: "pointer", borderTop: "1px solid var(--border)", textAlign: "center",
              }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                See all results for &ldquo;{query}&rdquo;
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Mobile menu panel (replaces the desktop dropdown nav on small screens) ──
function MobileAccordionSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid var(--border)" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 4px", background: "none", border: "none", color: "var(--text)",
        fontSize: 15, fontWeight: 600, cursor: "pointer",
      }}>
        {title}
        <svg width="13" height="13" viewBox="0 0 10 10" fill="none" style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "" }}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      </button>
      {open && <div style={{ paddingBottom: 16 }}>{children}</div>}
    </div>
  );
}

function ChipLink({ href, label, active }: { href: string; label: string; active?: boolean }) {
  return (
    <Link href={href}>
      <span style={{
        display: "inline-flex", alignItems: "center", padding: "7px 13px", borderRadius: 20,
        fontSize: 13, fontWeight: active ? 700 : 500,
        background: active ? "rgba(var(--accent-rgb), 0.16)" : "var(--surface2)",
        color: active ? "var(--accent2)" : "var(--text-muted)",
        border: `1px solid ${active ? "rgba(var(--accent-rgb), 0.35)" : "var(--border)"}`,
      }}>
        {label}
      </span>
    </Link>
  );
}

function MobileMenuPanel({ onNavigate, urlType, urlGenre, urlTheme }: {
  onNavigate: () => void;
  urlType: string; urlGenre: string; urlTheme: string;
}) {
  return (
    <div className="mobile-menu-panel" style={{
      position: "absolute", top: "100%", left: 0, right: 0,
      background: "#100e0c", borderBottom: "1px solid var(--border)",
      maxHeight: "calc(100vh - var(--nav-height))", overflowY: "auto",
      boxShadow: "0 16px 40px rgba(0,0,0,0.5)", zIndex: 150,
    }} onClick={onNavigate}>
      <div style={{ padding: "8px 20px 20px" }}>
        {[["Home", "/"], ["Browse", "/browse"], ["Schedule", "/schedule"]].map(([label, href]) => (
          <Link key={label} href={href}>
            <div style={{ padding: "13px 4px", fontSize: 15, fontWeight: 600, color: "var(--text)", borderBottom: "1px solid var(--border)" }}>
              {label}
            </div>
          </Link>
        ))}

        <MobileAccordionSection title="Types">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {TYPES.map(t => <ChipLink key={t} href={`/browse?type=${encodeURIComponent(t)}`} label={t} active={urlType.toLowerCase() === t.toLowerCase()} />)}
          </div>
        </MobileAccordionSection>

        <MobileAccordionSection title="Genres">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {GENRES_COLS.flat().map(g => <ChipLink key={g} href={`/browse?genre=${encodeURIComponent(g)}`} label={g} active={urlGenre.toLowerCase() === g.toLowerCase()} />)}
          </div>
        </MobileAccordionSection>

        <MobileAccordionSection title="Themes">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {THEMES_COLS.flat().map(t => <ChipLink key={t} href={`/browse?theme=${encodeURIComponent(t)}`} label={t} active={urlTheme.toLowerCase() === t.toLowerCase()} />)}
          </div>
        </MobileAccordionSection>
      </div>
    </div>
  );
}

// ── Inner navbar (needs Suspense for useSearchParams) ──────────────────────
function NavbarInner() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const onBrowse = pathname === "/browse";
  const onSchedule = pathname === "/schedule";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const urlGenre = onBrowse ? searchParams.get("genre") || "" : "";
  const urlType = onBrowse ? searchParams.get("type") || "" : "";
  const urlTheme = onBrowse ? searchParams.get("theme") || "" : "";

  const allGenres = GENRES_COLS.flat();
  const allThemes = THEMES_COLS.flat();

  const matchedGenre = allGenres.find(g => g.toLowerCase() === urlGenre.toLowerCase());
  const matchedTheme = allThemes.find(t => t.toLowerCase() === urlTheme.toLowerCase());
  const matchedType = TYPES.find(t => t.toLowerCase() === urlType.toLowerCase());

  // Close mobile overlays on route change
  useEffect(() => { setMobileMenuOpen(false); setMobileSearchOpen(false); }, [pathname]);

  const mobileOverlayOpen = mobileMenuOpen || mobileSearchOpen;

  return (
    <header className="site-header" style={{
      position: "sticky", top: 0, zIndex: 100,
      background: mobileOverlayOpen ? "#100e0c" : "transparent",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      minHeight: "var(--nav-height)",
      padding: "0 clamp(12px, 4vw, 32px)",
      transition: "background 0.15s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, height: "var(--nav-height)" }}>
        {/* Logo */}
        <Link href="/" aria-label="Next Anime home" style={{ display: "flex", alignItems: "center", marginRight: 20, flexShrink: 0, textDecoration: "none" }}>
         <Image
                className="navbar-logo-img"
                src="/logo-full.png"
                alt="Next Anime"
                width={180}
                height={55}
                priority
              />
        </Link>

        {/* Desktop nav links — flex:1 absorbs leftover space, pushing search/avatar right */}
        <nav className="nav-links-desktop" style={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
          <NavItem label="Home" href="/" active={pathname === "/"} />
          <NavItem label="Browse" href="/browse" active={onBrowse && !matchedType && !matchedGenre && !matchedTheme} />
          <NavItem label="Schedule" href="/schedule" active={onSchedule} />
          <NavItem label="Types" active={!!matchedType} dropdown={<TypesDropdown activeType={urlType} />} />
          <NavItem
            label={matchedGenre || "Genres"}
            active={!!matchedGenre}
            dropdown={<MultiColDropdown cols={GENRES_COLS} viewAllLabel="View all genres" viewAllHref="/browse" paramName="genre" activeValue={urlGenre} />}
          />
          <NavItem
            label={matchedTheme || "Themes"}
            active={!!matchedTheme}
            dropdown={<MultiColDropdown cols={THEMES_COLS} viewAllLabel="View all themes" viewAllHref="/browse" paramName="theme" activeValue={urlTheme} />}
          />
        </nav>

        {/* Desktop search */}
        <div className="navbar-search-desktop">
          <SearchBox />
        </div>

        {/* Desktop avatar */}
        <div className="avatar-desktop" style={{
          width: 34, height: 34, borderRadius: "50%",
          background: "var(--surface3)", border: "2px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", flexShrink: 0, marginLeft: 12,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Mobile-only controls: search toggle + hamburger */}
        <div className="mobile-controls" style={{ marginLeft: "auto", gap: 8, alignItems: "center" }}>
          <button
            aria-label="Search"
            onClick={() => { setMobileSearchOpen(o => !o); setMobileMenuOpen(false); }}
            style={{
              width: 36, height: 36, borderRadius: 8, background: mobileSearchOpen ? "var(--surface2)" : "none",
              border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--text)", cursor: "pointer",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M14.5 14.5L18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
          <button
            aria-label="Menu"
            onClick={() => { setMobileMenuOpen(o => !o); setMobileSearchOpen(false); }}
            style={{
              width: 36, height: 36, borderRadius: 8, background: mobileMenuOpen ? "var(--surface2)" : "none",
              border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--text)", cursor: "pointer",
            }}
          >
            {mobileMenuOpen ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile expanded search row */}
      {mobileSearchOpen && (
        <div style={{ padding: "10px 0 14px" }}>
          <SearchBox fullWidth autoFocus />
        </div>
      )}

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <MobileMenuPanel onNavigate={() => setMobileMenuOpen(false)} urlType={urlType} urlGenre={urlGenre} urlTheme={urlTheme} />
      )}
    </header>
  );
}

// ── Main Navbar export (wraps in Suspense so it's safe on any page) ────────
export default function Navbar() {
  return (
    <Suspense fallback={
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(13,13,20,0.97)", backdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--border)", height: "var(--nav-height)",
      }} />
    }>
      <NavbarInner />
    </Suspense>
  );
}
