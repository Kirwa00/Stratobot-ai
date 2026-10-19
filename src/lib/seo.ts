import type { Metadata } from "next";

// Vercel's domain config redirects the apex (stratobot.trade) to www with a
// 308 — www is the host that actually serves 200, so canonical/OG/sitemap
// URLs must point there, not at the apex that redirects away from itself.
export const SITE_URL = "https://www.stratobot.trade";
const SITE_NAME = "StratoBot AI";

/**
 * Merges a page's title/description into a full Metadata object with a
 * canonical URL and Open Graph/Twitter tags derived from the same copy —
 * one call site instead of repeating OG/canonical boilerplate on every page.
 */
export function buildMetadata({
  title,
  description,
  path,
  image,
  video,
}: {
  title: string;
  description: string;
  path: string;
  /** Absolute or site-relative preview image (e.g. a video poster). */
  image?: { url: string; width: number; height: number; alt: string };
  /** A video embedded on the page, for link previews. */
  video?: { url: string; width: number; height: number };
}): Metadata {
  const url = `${SITE_URL}${path}`;
  const abs = (u: string) => (u.startsWith("http") ? u : `${SITE_URL}${u}`);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      ...(image ? { images: [{ ...image, url: abs(image.url) }] } : {}),
      ...(video ? { videos: [{ ...video, url: abs(video.url), type: "video/mp4" }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [abs(image.url)] } : {}),
    },
  };
}
