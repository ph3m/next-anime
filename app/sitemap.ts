import type { MetadataRoute } from "next";
import { getTrending, getPopular } from "@/lib/anilist";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nextanime.app";

// Static routes always included, plus the most-trafficked anime detail pages
// (trending + popular) so crawlers have a direct path to high-value content
// without us needing a full database dump of every title.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/browse`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/schedule`, changeFrequency: "hourly", priority: 0.8 },
  ];

  try {
    const [trending, popular] = await Promise.all([getTrending(1, 50), getPopular(1, 50)]);
    const seen = new Set<number>();
    const animeRoutes: MetadataRoute.Sitemap = [];
    for (const a of [...trending, ...popular]) {
      if (seen.has(a.id)) continue;
      seen.add(a.id);
      animeRoutes.push({
        url: `${SITE_URL}/anime/${a.id}`,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
    return [...staticRoutes, ...animeRoutes];
  } catch {
    // If AniList is unreachable at build/request time, still ship the static routes.
    return staticRoutes;
  }
}
