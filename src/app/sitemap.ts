import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const HIGH_PRIORITY_PATHS = ["/"];

const SECTION_INDEX_PATHS = ["/tools", "/learn", "/blog", "/resources"];

const PATHS = [
  "/",
  "/app",
  "/pricing",
  "/faq",
  "/how-it-works",
  "/features",
  "/convert-strategy-to-ea",
  "/demo",
  "/backtesting",
  "/performance",
  "/risk-management",
  "/resources",
  "/vps",
  "/prop-firms",
  "/beta",
  "/feedback",
  "/login",
  "/tools",
  "/tools/position-size-calculator",
  "/tools/lot-size-calculator",
  "/tools/forex-risk-calculator",
  "/tools/drawdown-calculator",
  "/tools/forex-profit-calculator",
  "/tools/compound-trading-calculator",
  "/tools/prop-firm-calculator",
  "/tools/prop-firm-consistency-calculator",
  "/tools/risk-of-ruin-calculator",
  "/tools/ea-profit-calculator",
  "/tools/trading-cost-calculator",
  "/create-mt5-ea",
  "/ai-ea-generator",
  "/mql5-ea-generator",
  "/automate-forex-strategy",
  "/how-to-automate-forex-trading",
  "/how-to-create-mt5-ea",
  "/trading-strategy-to-ea",
  "/tradingview-to-mt5",
  "/compare/ea-programmer-alternative",
  "/compare/mql5-programmer",
  "/compare/ea-generator",
  "/learn",
  "/learn/what-is-an-expert-advisor",
  "/learn/mql4-vs-mql5",
  "/learn/what-is-algorithmic-trading",
  "/learn/pips-lots-leverage-explained",
  "/learn/common-automation-mistakes",
  "/learn/how-to-backtest-a-trading-strategy",
  "/blog",
  "/blog/stratobot-beta-launch",
  "/blog/why-we-dont-call-it-an-ai-trading-bot",
  "/blog/real-cost-of-hiring-an-mql5-programmer",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: HIGH_PRIORITY_PATHS.includes(path)
      ? ("weekly" as const)
      : ("monthly" as const),
    priority: HIGH_PRIORITY_PATHS.includes(path)
      ? 1
      : SECTION_INDEX_PATHS.includes(path)
        ? 0.7
        : 0.5,
  }));
}
