import Link from "next/link";
import { ArticleShell, ArticleSection } from "@/components/ArticleShell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "MQL4 vs MQL5: What's the Difference? — StratoBot AI",
  description: "The real architectural differences between MQL4 and MQL5, and why EAs aren't directly portable between MetaTrader 4 and 5.",
  path: "/learn/mql4-vs-mql5",
});

const DIFFERENCES = [
  {
    title: "Different platforms entirely",
    body: "MQL4 runs in MetaTrader 4; MQL5 runs in MetaTrader 5. They're separate applications, and code written for one doesn't run in the other without being rewritten.",
  },
  {
    title: "Position handling",
    body: "MT4 is hedging-only — you can hold multiple opposing positions on the same symbol. MT5 defaults to netting (positions on the same symbol merge into one), with hedging available as an account-level setting depending on the broker.",
  },
  {
    title: "Language structure",
    body: "MQL5 is built around a fuller object-oriented model with a standard class library (CTrade for order execution, CExpert for strategy scaffolding, and more). Older MQL4 code tends to be more procedural, though MQL4 has adopted much of MQL5's syntax over time.",
  },
  {
    title: "Indicator access",
    body: "MQL5 uses indicator handles plus CopyBuffer() to read values — an extra setup step compared to MQL4's older direct-call style, but it scales better for multi-symbol, multi-timeframe strategies.",
  },
  {
    title: "Timeframes and testing",
    body: "MT5 supports more built-in timeframes and a more capable Strategy Tester, including multi-currency backtesting in one pass — useful if a strategy trades several pairs at once.",
  },
];

export default function Mql4VsMql5Page() {
  return (
    <ArticleShell
      backTitle="Learn"
      title="MQL4 vs MQL5: What's the difference?"
      intro="They share a name and a lot of syntax, but MQL4 and MQL5 are different languages for different platforms — and an EA built for one won't run on the other without real rework."
    >
      <ArticleSection title="The differences that actually matter">
        <div className="flex flex-col gap-3">
          {DIFFERENCES.map((d) => (
            <div key={d.title}>
              <p className="font-semibold text-chalk mb-1">{d.title}</p>
              <p className="text-chalk/70">{d.body}</p>
            </div>
          ))}
        </div>
      </ArticleSection>

      <ArticleSection title="Which one should you use?">
        <p>
          If you&apos;re starting fresh, MQL5 on MetaTrader 5 is the more current, actively
          developed option, with a broker ecosystem that&apos;s largely moved that direction. MT4
          still has a large installed base, mostly for legacy reasons and specific broker/regional
          preferences.
        </p>
      </ArticleSection>

      <p className="text-sm text-chalk/70 text-center">
        <Link href="/mql5-ea-generator" className="text-secondary hover:underline">
          What StratoBot&apos;s generated MQL5 code actually contains
        </Link>
      </p>
    </ArticleShell>
  );
}
