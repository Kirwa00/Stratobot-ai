import Link from "next/link";
import { ArticleShell, ArticleSection } from "@/components/ArticleShell";

export const metadata = {
  title: "What Is an Expert Advisor (EA)? — StratoBot AI",
  description: "A plain explanation of what an Expert Advisor is, how it trades, and what it actually needs to work.",
};

export default function WhatIsAnExpertAdvisorPage() {
  return (
    <ArticleShell
      backTitle="Learn"
      title="What Is an Expert Advisor (EA)?"
      intro="An Expert Advisor is a program that runs inside MetaTrader 4 or 5 and trades automatically, following a fixed set of rules — with no discretion, no hesitation, and no deviation from what it was told to do."
    >
      <ArticleSection title="What it actually does">
        <p>
          An EA watches the market on a chart and checks its rules on every price tick or every
          new candle, depending on how it&apos;s written. When a condition matches — say, a moving
          average crossover, or a price sweep of yesterday&apos;s high — it places, modifies, or
          closes a trade automatically, through MetaTrader&apos;s own order execution.
        </p>
        <p>
          It doesn&apos;t &ldquo;think&rdquo; or adapt beyond what its code defines. If a rule is
          wrong or incomplete, the EA executes the wrong or incomplete rule exactly as faithfully
          as it would execute a correct one.
        </p>
      </ArticleSection>

      <ArticleSection title="What it needs to run">
        <ul className="flex flex-col gap-1.5">
          {[
            "MetaTrader 4 or 5 installed and running",
            "The compiled EA file (.ex4 or .ex5) placed in the correct Experts folder",
            "Algo Trading / AutoTrading enabled in the terminal",
            "The terminal open and connected — an EA stops working the moment MetaTrader closes",
          ].map((line) => (
            <li key={line} className="flex items-start gap-2">
              <span className="material-symbols-outlined text-buy text-base mt-0.5">check</span>
              {line}
            </li>
          ))}
        </ul>
        <p>
          That last point is why people running EAs long-term usually end up on a VPS — a remote
          computer that keeps MetaTrader open 24/7 even when their own laptop is off.
        </p>
      </ArticleSection>

      <ArticleSection title="What it isn't">
        <p>
          An EA isn&apos;t a guarantee of profit, and a well-built one isn&apos;t proof a strategy
          works — it&apos;s proof the strategy&apos;s <em>rules</em> are being executed correctly.
          Whether those rules are actually profitable is a separate question, answered by testing
          on real historical data and, eventually, a demo account.
        </p>
      </ArticleSection>

      <p className="text-sm text-chalk/70 text-center">
        <Link href="/learn/mql4-vs-mql5" className="text-secondary hover:underline">
          Next: MQL4 vs MQL5
        </Link>{" "}
        · <Link href="/how-it-works" className="text-secondary hover:underline">
          How StratoBot builds one from your description
        </Link>
      </p>
    </ArticleShell>
  );
}
