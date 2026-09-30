import Link from "next/link";
import { ArticleFaq, ArticleSection, ArticleShell, ArticleSteps } from "@/components/ArticleShell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "How to Convert an MT4 EA to MT5 — StratoBot AI",
  description:
    "MT4 Expert Advisors don't run in MetaTrader 5. What converting one actually involves, why an .ex4 file can't be converted, and your three realistic options.",
  path: "/learn/convert-mt4-ea-to-mt5",
});

const CHANGES = [
  {
    title: "Orders become positions, orders and deals",
    body: "MT4 has one pool of orders. MT5 separates pending orders, open positions and executed deals, and accounts can be netting (one position per symbol) or hedging. Every piece of trade-management code has to be rewritten, usually around MT5's CTrade class.",
  },
  {
    title: "Price arrays disappear",
    body: "MQL4's ready-made arrays like Close[], High[] and Bars don't exist in MQL5. Prices are read with functions such as iClose() or CopyRates().",
  },
  {
    title: "Indicators work differently",
    body: "In MQL4 you call iMA() and get a value. In MQL5, iMA() returns a handle you create once, then read with CopyBuffer(). Every indicator call in the EA changes shape.",
  },
  {
    title: "Error handling and order checks",
    body: "Return codes, filling modes and trade-request checks differ, so logic that 'just worked' in MT4 has to be re-tested in MT5's Strategy Tester.",
  },
];

const OPTIONS = [
  {
    title: "Rewrite it yourself from the .mq4 source",
    body: (
      <>
        Realistic if you have the source and know MQL. Plan for a rewrite, not a find-and-replace, and re-test
        everything.{" "}
        <Link href="/learn/mql4-vs-mql5" className="text-secondary hover:underline">
          MQL4 vs MQL5 explained
        </Link>
        .
      </>
    ),
  },
  {
    title: "Hire an MQL5 programmer",
    body: (
      <>
        The usual route for complex EAs. Give them the .mq4 source and a written description of what it should
        do.{" "}
        <Link href="/compare/mql5-programmer" className="text-secondary hover:underline">
          What that typically involves
        </Link>
        .
      </>
    ),
  },
  {
    title: "Rebuild it from the strategy rules",
    body: (
      <>
        If you know what the EA does (its entries, exits and risk rules), you don&apos;t need the old code at all.
        Describe the rules in StratoBot and it builds a fresh MT5 EA.{" "}
        <Link href="/how-to-create-mt5-ea" className="text-secondary hover:underline">
          How that works
        </Link>
        .
      </>
    ),
  },
];

const FAQ = [
  { q: "Can MT5 run MT4 Expert Advisors?", a: "No. MetaTrader 5 only runs MQL5 programs (.ex5). MT4 EAs (.ex4 / .mq4) have to be rewritten or rebuilt for MT5." },
  { q: "Can I convert an .ex4 file to MT5?", a: "No. An .ex4 file is compiled, so there's no code to convert. You need the .mq4 source, or you rebuild the EA from a description of its rules." },
  { q: "Is there an automatic MQL4 to MQL5 converter?", a: "Some converters and compatibility libraries exist and can help with simple code, but order handling, indicator access and price data all work differently in MQL5, so the output still needs to be checked line by line and re-tested." },
];

export default function ConvertMt4EaPage() {
  return (
    <ArticleShell
      backTitle="Learn"
      title="How to convert an MT4 EA to MT5"
      intro="An MT4 Expert Advisor won't run in MetaTrader 5. The two platforms use different languages, MQL4 and MQL5, so 'converting' really means rewriting or rebuilding the EA. Here's what changes and what your options are."
    >
      <ArticleSection title="First: what file do you have?">
        <p>
          With the <code>.mq4</code> source code, the EA can be rewritten for MT5. With only a compiled{" "}
          <code>.ex4</code> file, it can&apos;t be converted: there&apos;s no readable code inside to work from. In
          that case your options are the original author, or rebuilding the EA from its rules.
        </p>
      </ArticleSection>

      <ArticleSection title="What changes between MQL4 and MQL5">
        <ArticleSteps steps={CHANGES} />
      </ArticleSection>

      <ArticleSection title="Your three options">
        <ArticleSteps steps={OPTIONS} />
      </ArticleSection>

      <ArticleFaq items={FAQ} />

      <p className="text-sm text-chalk/70 text-center">
        <Link href="/learn/how-to-add-expert-advisor-mt5" className="text-secondary hover:underline">
          Installing an EA in MT5
        </Link>{" "}
        ·{" "}
        <Link href="/learn/how-to-backtest-an-ea-in-mt5" className="text-secondary hover:underline">
          Backtesting it
        </Link>
      </p>
    </ArticleShell>
  );
}
