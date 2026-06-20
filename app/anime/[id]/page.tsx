import type { Metadata } from "next";
import Link from "next/link";
import { getAnimeById } from "@/lib/anilist";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import AnimeDetailClient from "./AnimeDetailClient";

// Server Component: fetches anime data once (server-side, cached/coalesced
// via lib/anilist) and uses it both for per-page SEO metadata and as the
// initial payload handed to the interactive client component below —
// no duplicate client-side fetch for the same data.

function stripHtml(html: string | null): string {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const anime = await getAnimeById(parseInt(id)).catch(() => null);

  if (!anime) {
    return { title: "Anime Not Found" };
  }

  const title = anime.title.english || anime.title.romaji;
  const description = stripHtml(anime.description).slice(0, 160) ||
    `Watch ${title} online — episodes, ratings, trailer, and more on Next Anime.`;
  const image = anime.bannerImage || anime.coverImage.extraLarge || anime.coverImage.large;

  return {
    title,
    description,
    alternates: { canonical: `/anime/${id}` },
    openGraph: {
      title: `${title} | Next Anime`,
      description,
      type: "video.tv_show",
      images: image ? [{ url: image, width: 1200, height: 630, alt: title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Next Anime`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function AnimePage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const anime = await getAnimeById(parseInt(id)).catch(() => null);

  if (!anime) {
    return (
      <div style={{ minHeight: "100vh" }}>
        <Navbar />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 12, color: "var(--text-muted)" }}>
          <div style={{ fontSize: 48 }}>🍃</div>
          <p style={{ fontSize: 18, fontWeight: 600 }}>Anime not found</p>
          <Link href="/" style={{ color: "var(--accent)", fontSize: 14 }}>← Back to Home</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const title = anime.title.english || anime.title.romaji;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    name: title,
    alternateName: anime.title.romaji !== title ? anime.title.romaji : undefined,
    description: stripHtml(anime.description).slice(0, 500) || undefined,
    image: anime.coverImage.extraLarge || anime.coverImage.large,
    genre: anime.genres,
    numberOfEpisodes: anime.episodes || undefined,
    datePublished: anime.seasonYear ? String(anime.seasonYear) : undefined,
    aggregateRating: anime.averageScore ? {
      "@type": "AggregateRating",
      ratingValue: (anime.averageScore / 10).toFixed(1),
      bestRating: "10",
      worstRating: "0",
    } : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AnimeDetailClient anime={anime} id={id} />
    </>
  );
}
