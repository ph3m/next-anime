<div align="center">

<img src="public/logo-full.png" alt="Next Anime" width="360" />

### A full-stack anime discovery platform built with Next.js 16, the AniList GraphQL API, and a custom caching layer designed for high-concurrency traffic.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Live Demo](#) · [Report a Bug](../../issues) · [Request a Feature](../../issues)

</div>

---

## About

**Next Anime** is a portfolio project exploring how to build a content-heavy, data-driven web app that stays fast and stable under real traffic — not just a CRUD app, but one with the kind of caching, request-coalescing, and SEO architecture you'd actually need in production.

It pulls live anime metadata from the [AniList GraphQL API](https://anilist.co/graphiql) and wraps it in:
- a homepage with rotating hero banners and curated rails,
- a full filterable **Browse** page (genre / type / theme / status / season / year / sort),
- a live **Airing Schedule** page grouped by time of day,
- and per-title detail pages with server-rendered SEO metadata and JSON-LD.

> **Disclaimer:** This is a portfolio/learning project demonstrating frontend architecture, API integration, and caching strategy. Anime metadata comes from the public AniList API. The embedded video player on detail pages points at third-party demo sources and is included to show end-to-end UI flow only — it is not a production streaming service, isn't affiliated with AniList or any rights holder, and shouldn't be treated as one.

## Features

| | |
|---|---|
| 🔥 **Smart caching layer** | In-memory TTL cache + in-flight request coalescing — concurrent identical requests share one network call instead of hammering the upstream API |
| 🔍 **Live search** | Debounced autocomplete dropdown, results grid with pagination |
| 🎛️ **Advanced filtering** | `/browse` supports genre, theme (AniList tags), format, status, season, year, and sort — all reflected in shareable URLs |
| 📅 **Airing schedule** | Day-strip calendar + episodes grouped by local time-of-day, computed client-side per viewer timezone |
| ⚡ **SEO-first detail pages** | Anime pages are React Server Components with per-page `generateMetadata`, Open Graph images, and `TVSeries` JSON-LD — not a single static `<title>` for the whole site |
| 🗺️ **Dynamic sitemap + robots.txt** | Auto-generated from live trending/popular data via Next.js metadata file conventions |
| 🎨 **Custom design system** | CSS-variable-driven theme (easy to re-skin), responsive card rails, skeleton loading states |

## Tech Stack

**Framework:** Next.js 16 (App Router, Server Components, Turbopack) · React 19 · TypeScript
**Styling:** Tailwind CSS 4, CSS custom properties for theming
**Data:** AniList GraphQL API
**Architecture:** Custom fetch client with TTL caching, request coalescing, and 429 retry/backoff (see [`lib/anilist.ts`](lib/anilist.ts))

## Architecture Highlights

A few things in here that go beyond a typical tutorial project, worth a look if you're reviewing the code:

- **`lib/anilist.ts`** — every AniList call goes through a single client that (1) serves from an in-memory cache when fresh, (2) coalesces concurrent identical requests into one in-flight promise so traffic spikes don't fan out into duplicate upstream calls, and (3) retries on `429` honoring `Retry-After`.
- **`app/anime/[id]/page.tsx`** — split into a Server Component (`generateMetadata`, JSON-LD, initial data fetch) and a Client Component (`AnimeDetailClient.tsx`) for interactivity, so each anime page gets correct per-page SEO without losing the rich client-side player UI.
- **API routes** set `Cache-Control: s-maxage / stale-while-revalidate` so a CDN can absorb repeat traffic before it ever reaches the app server.

## Getting Started

```bash
git clone https://github.com/ph3m/next-anime.git
cd next-anime
npm install
cp .env.example .env.local   # optional — only needed for canonical/OG URLs
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
├─ page.tsx                  # Homepage (hero, rails, top 10)
├─ browse/page.tsx           # Filterable browse grid
├─ schedule/page.tsx         # Airing schedule
├─ anime/[id]/
│  ├─ page.tsx               # Server Component — metadata + JSON-LD
│  └─ AnimeDetailClient.tsx  # Client Component — player, episodes, UI
├─ components/
│  ├─ Navbar.tsx             # Search, filter-aware dropdowns
│  └─ Footer.tsx
├─ api/                      # Route handlers (anilist, browse, schedule, episodes)
├─ sitemap.ts / robots.ts / manifest.ts
lib/
├─ anilist.ts                # Cached/coalesced GraphQL client
└─ constants.ts              # Shared filter vocab (genres/themes/types)
```

## Roadmap

- [ ] Persistent watchlist (with export to JSON/CSV)
- [ ] "Add to calendar" (.ics) for schedule entries
- [ ] User accounts / auth
- [ ] Redis-backed cache for multi-instance deployments

## License

MIT — see [LICENSE](LICENSE). Anime data and artwork are property of their respective owners; this project claims no ownership over third-party content.
