import type { Metadata, Viewport } from "next";
import "./globals.css";

// Set NEXT_PUBLIC_SITE_URL in your deployment env to your real domain —
// this powers canonical URLs and absolute Open Graph/Twitter image paths.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nextanime.app";
const SITE_NAME = "Next Anime";
const DESCRIPTION =
  "Next Anime is a free anime streaming hub — browse thousands of series and movies by genre, theme, or airing schedule, track what's new this season, and pick up where you left off.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — Watch Anime Free Online`, template: `%s | ${SITE_NAME}` },
  description: DESCRIPTION,
  keywords: ["anime", "watch anime online", "anime streaming", "free anime", "anime schedule", "anime genres", "manga"],
  applicationName: SITE_NAME,
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Watch Anime Free Online`,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Watch Anime Free Online`,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d0d0d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
