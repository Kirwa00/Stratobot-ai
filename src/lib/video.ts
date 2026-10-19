// Single source of truth for the explainer video: the on-page player, its
// VideoObject structured data, the video sitemap entry and Open Graph tags all
// read from here, so they can't drift apart.

import { SITE_URL } from "./seo";

export const EXPLAINER = {
  /** The page where the video is the main content (the one Google should index it on). */
  pagePath: "/how-it-works",
  src: "/videos/stratobot-explainer.mp4",
  poster: "/videos/stratobot-explainer-poster.jpg",
  width: 1920,
  height: 1080,
  durationSec: 67,
  uploadDate: "2026-10-19T08:00:00+03:00",
  title: "How to Turn a Trading Strategy Into an MT5 Expert Advisor (No Coding)",
  description:
    "A 1-minute walkthrough of StratoBot: describe your forex strategy in plain language, review the rules it will trade, run a free logic check that explains every trade, and download a MetaTrader 5 (.mq5) Expert Advisor. KES 2,500 per month, free during the beta.",
  keywords: [
    "MT5 Expert Advisor",
    "create MT5 EA without coding",
    "trading strategy to EA",
    "MQL5 EA generator",
    "no-code EA builder",
    "MetaTrader 5 trading bot",
    "forex automated trading",
    "StratoBot",
  ],
  /** Start times in seconds, read from the video's section titles. */
  chapters: [
    { t: 0, label: "Intro" },
    { t: 5, label: "Building an EA used to mean weeks" },
    { t: 11, label: "Describe your strategy" },
    { t: 21, label: "Review the logic" },
    { t: 31, label: "Check that it fires" },
    { t: 42, label: "Download your .mq5" },
    { t: 53, label: "Pricing" },
    { t: 60, label: "Get started" },
  ],
};

export const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function explainerJsonLd() {
  const page = `${SITE_URL}${EXPLAINER.pagePath}`;
  const chapters = EXPLAINER.chapters;
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: EXPLAINER.title,
    description: EXPLAINER.description,
    thumbnailUrl: [`${SITE_URL}${EXPLAINER.poster}`],
    contentUrl: `${SITE_URL}${EXPLAINER.src}`,
    uploadDate: EXPLAINER.uploadDate,
    duration: `PT1M${EXPLAINER.durationSec - 60}S`,
    width: EXPLAINER.width,
    height: EXPLAINER.height,
    inLanguage: "en",
    isFamilyFriendly: true,
    keywords: EXPLAINER.keywords.join(", "),
    publisher: { "@type": "Organization", name: "StratoBot", url: SITE_URL },
    // Key moments: each clip links to the page with ?t=, which the player seeks to.
    hasPart: chapters.map((c, i) => ({
      "@type": "Clip",
      name: c.label,
      startOffset: c.t,
      endOffset: i + 1 < chapters.length ? chapters[i + 1].t : EXPLAINER.durationSec,
      url: `${page}?t=${c.t}`,
    })),
  };
}
