// Embed providers that map AniList/MAL IDs to working iframe URLs
// These use the anime's MAL ID which AniList provides

export interface EmbedProvider {
  name: string;
  getUrl: (malId: number, episode: number, dub?: boolean) => string;
}

// These providers accept MAL ID + episode number directly
export const EMBED_PROVIDERS: EmbedProvider[] = [
  {
    name: "2Embed",
    getUrl: (malId, ep) =>
      `https://2embed.skin/embed/mal/anime/${malId}/${ep}`,
  },
  {
    name: "AniEmbed",
    getUrl: (malId, ep, dub) =>
      `https://player.anichin.fun/?mal=${malId}&ep=${ep}&dub=${dub ? 1 : 0}`,
  },
  {
    name: "AnimeHub",
    getUrl: (malId, ep) =>
      `https://animehub.ac/embed/mal/${malId}/episode/${ep}`,
  },
];

export const DEFAULT_PROVIDER = EMBED_PROVIDERS[0];
