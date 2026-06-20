// Shared filter vocabulary used by the Navbar dropdowns and the /browse page,
// so the two never drift out of sync.

export const GENRES_COLS = [
  ["Comedy", "Drama", "Sci-Fi", "Mystery", "Suspense", "Gourmet", "Avant Garde"],
  ["Action", "Romance", "Supernatural", "Slice of Life", "Horror", "Girls Love", "Erotica"],
  ["Fantasy", "Adventure", "Ecchi", "Sports", "Award Winning", "Boys Love", "Hentai"],
];

export const THEMES_COLS = [
  ["School", "Historical", "Super Power", "Mythology", "CGDCT", "Urban Fantasy", "Anthropomorphic", "Workplace"],
  ["Adult Cast", "Harem", "Music", "Psychological", "Space", "Gag Humor", "Iyashikei", "Mahou Shoujo"],
  ["Mecha", "Military", "Isekai", "Parody", "Gore", "Martial Arts", "Detective", "Team Sports"],
];

export const TYPES = ["TV", "Movie", "OVA", "ONA", "Special", "Music"];

// UI label -> AniList MediaFormat enum value
export const TYPE_TO_FORMAT: Record<string, string> = {
  TV: "TV",
  Movie: "MOVIE",
  OVA: "OVA",
  ONA: "ONA",
  Special: "SPECIAL",
  Music: "MUSIC",
};

export const STATUS_OPTIONS = [
  { label: "Finished", value: "FINISHED" },
  { label: "Releasing", value: "RELEASING" },
  { label: "Not Yet Released", value: "NOT_YET_RELEASED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Hiatus", value: "HIATUS" },
];

export const SEASON_OPTIONS = ["Winter", "Spring", "Summer", "Fall"];

export const SORT_OPTIONS = [
  { label: "Trending", value: "TRENDING_DESC" },
  { label: "Popularity", value: "POPULARITY_DESC" },
  { label: "Top Rated", value: "SCORE_DESC" },
  { label: "Newest", value: "START_DATE_DESC" },
  { label: "Title A-Z", value: "TITLE_ROMAJI" },
];

export const GENRES_FLAT = GENRES_COLS.flat();
export const THEMES_FLAT = THEMES_COLS.flat();

export function currentYearList(span = 35) {
  const now = new Date().getFullYear();
  return Array.from({ length: span }, (_, i) => now - i);
}
