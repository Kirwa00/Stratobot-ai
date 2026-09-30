import Link from "next/link";
import { ArticleFaq, ArticleSection, ArticleShell, ArticleSteps } from "@/components/ArticleShell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Using an MT5 EA on a Prop Firm Account: What to Check — StratoBot AI",
  description:
    "Can you use an Expert Advisor on a prop firm challenge? What firms typically restrict, and how to make an MT5 EA respect daily loss, drawdown, news and consistency rules.",
  path: "/learn/mt5-ea-for-prop-firms",
});

const CHECKS = [
  {
    title: "Are EAs allowed on your program at all?",
    body: "Many prop firms allow Expert Advisors, but rules differ by firm and even by challenge type, and they change. Read the current terms for the exact program you're buying before you attach anything.",
  },
  {
    title: "Which kinds of EA are banned",
    body: "Commonly restricted: high-frequency or tick scalping, latency arbitrage, strategies that exploit demo-server pricing, and third-party EAs run identically by many traders. An EA running your own strategy is usually the safest category.",
  },
  {
    title: "Daily loss and maximum drawdown",
    body: (
      <>
        These are the rules that end most challenges. Your EA should stop trading well before the firm&apos;s limit,
        not at it, because open losing trades count too.{" "}
        <Link href="/tools/drawdown-calculator" className="text-secondary hover:underline">
          Drawdown calculator
        </Link>
        .
      </>
    ),
  },
  {
    title: "Consistency rules",
    body: (
      <>
        Some firms cap how much of your total profit can come from a single day. An EA that makes one big winning
        day can fail this even while it&apos;s profitable.{" "}
        <Link href="/tools/prop-firm-consistency-calculator" className="text-secondary hover:underline">
          Consistency rule calculator
        </Link>
        .
      </>
    ),
  },
  {
    title: "News and weekend rules",
    body: "Some programs forbid trading around high-impact news or holding positions over the weekend. If yours does, the EA needs a news filter and a time exit rather than you remembering to switch it off.",
  },
];

const SETUP = [
  { title: "Use your own strategy", body: "A shared or purchased EA is the most likely to be flagged. Build the EA from rules you actually trade." },
  { title: "Size by risk, not fixed lots", body: "Set risk per trade as a percentage of balance with a stop loss on every trade, so position size shrinks as the account does." },
  { title: "Add a daily loss limit below the firm's", body: "If the firm allows 5% a day, stop the EA at 3 to 4% so a slipped stop or an open trade can't push you over." },
  { title: "Test on the firm's demo or a free trial first", body: "Symbols, spreads and trading hours at a prop firm's server can differ from your usual broker." },
];

const FAQ = [
  { q: "Can you use an EA on a prop firm challenge?", a: "Often yes, but it depends on the firm and the specific program, and the terms change over time. Check the current rules for the program you're buying; high-frequency, arbitrage and widely shared third-party EAs are the most commonly banned." },
  { q: "How do I stop an EA breaking a prop firm's daily loss rule?", a: "Give the EA its own daily loss limit set below the firm's limit, use a stop loss on every trade, and size positions by risk percentage so losses shrink as the account shrinks." },
  { q: "Is a purchased EA safe to use on a prop firm account?", a: "It's the riskiest option: firms often flag EAs that many traders run identically, and you can't easily check what the code does. An EA built from your own rules avoids both problems." },
];

export default function Mt5EaPropFirmsPage() {
  return (
    <ArticleShell
      backTitle="Learn"
      title="Using an MT5 EA on a prop firm account"
      intro="An Expert Advisor can take emotion out of a prop firm challenge, and it can also fail one in minutes if it ignores the firm's rules. Here's what to check before you attach an EA to a funded or challenge account."
    >
      <ArticleSection title="Check the rules first">
        <ArticleSteps steps={CHECKS} />
      </ArticleSection>

      <ArticleSection title="Set the EA up to protect the account">
        <ArticleSteps steps={SETUP} />
        <p>
          StratoBot EAs can include a max daily loss limit, risk-per-trade sizing and a news filter as
          plain-language rules. They still won&apos;t make a strategy pass a challenge; they only stop the EA
          breaking rules you&apos;ve set.
        </p>
      </ArticleSection>

      <ArticleFaq items={FAQ} />

      <p className="text-sm text-chalk/70 text-center">
        <Link href="/prop-firms" className="text-secondary hover:underline">
          Compare prop firms
        </Link>{" "}
        ·{" "}
        <Link href="/tools/prop-firm-calculator" className="text-secondary hover:underline">
          Prop firm calculator
        </Link>
      </p>
    </ArticleShell>
  );
}
