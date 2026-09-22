import type { Metadata } from "next";

export const SITE_URL = "https://stratobot.trade";
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
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const url = `${SITE_URL}${path}`;
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
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}
