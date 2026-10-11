import Link from "next/link";
import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";
import { Footer } from "@/components/Footer";
import { EXAMPLE_STRATEGIES, FREE_SIMS, PRO_DAYS, PRICE_KES } from "@/lib/constants";
import { TrackView } from "@/components/TrackView";
import { TrackedLink } from "@/components/TrackedLink";
import { RulesReadback } from "@/components/RulesReadback";
import { parsePrompt } from "@/lib/parser";
import { blocksToRules } from "@/lib/rules/from-blocks";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "StratoBot AI — Turn Your Trading Strategy Into an EA",
  description: "Describe your trading strategy in plain language, review the logic, and download a real MetaTrader 5 Expert Advisor you can inspect and test. No MQL4/MQL5 programming, no hiring a programmer.",
  path: "/",
});

const OLD_WAY_STEPS = [
  "Write a technical spec",
  "Find an MQL4/MQL5 programmer",
  "Explain the strategy, repeatedly",
  "Pay upfront",
  "Wait 2–4+ weeks",
  "Test it yourself",
  "Request revisions",
  "Pay again",
];

const HOW_IT_WORKS_STEPS = [
  { icon: "edit_note", title: "Describe it", body: "Write your entry and exit rules the way you'd explain them to another trader." },
  { icon: "fact_check", title: "Review the logic", body: "See exactly what the bot will do, rule by rule. Anything I can't build is flagged, not guessed." },
  { icon: "science", title: "Check it fires", body: "A free logic check runs your exact rules on a made-up price path and explains every trade." },
  { icon: "download", title: "Download the .mq5", body: "Get a real MQL5 source file you can open, read, compile and test in MetaTrader 5." },
] as const;

const FEATURES = [
  { icon: "edit_note", title: "Plain-language input", body: "No technical spec required — describe entries, exits, and risk rules like you'd explain them to another trader." },
  { icon: "code", title: "Deterministic MQL5", body: "Your rules are compiled by a deterministic compiler, not written freeform by AI. The compiler is checked against MetaTrader 5's own Strategy Tester." },
  { icon: "download", title: "Code you can inspect", body: "An ordinary .mq5 source file you open in MetaEditor, read, compile, and run — nothing locked to our platform." },
];

const EXAMPLE = EXAMPLE_STRATEGIES[0];
// The real readback the app shows for this example, built by the same parser and
// compiler the live site uses, so the homepage can't promise something the product doesn't do.
const EXAMPLE_RULES = blocksToRules(parsePrompt(EXAMPLE).blocks);

export default function LandingPage() {
  return (
    <div className="flex flex-col flex-1">
      <TrackView event="landing_page_view" />
      <Header />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-8">
        {/* Hero */}
        <div>
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-signal mb-2">
            Strategy → EA for MetaTrader 5
          </p>
          <h1 className="font-display font-bold text-[28px] leading-tight text-chalk mb-3">
            Your trading strategy. Your EA. No coding required.
          </h1>
          <p className="text-[15px] text-chalk/75 leading-relaxed mb-5">
            Turn your forex trading rules into an Expert Advisor for MetaTrader 5. Describe your
            strategy, review the logic, and download code you can inspect and test.
          </p>
          <div className="flex flex-col gap-2.5">
            <TrackedLink href="/app" event="primary_cta_clicked" props={{ location: "hero" }} className="w-full">
              Build My EA
            </TrackedLink>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-lg border border-outline text-chalk font-semibold text-[15px] px-5 py-3.5 min-h-[44px] hover:bg-slate-high hover:border-signal/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
            >
              See How It Works
            </a>
          </div>
          <p className="text-xs text-chalk/50 mt-3 text-center">
            Free to describe and check — no account needed.
          </p>
        </div>

        {/* How it works */}
        <section id="how-it-works" aria-labelledby="how-heading" className="scroll-mt-4">
          <h2 id="how-heading" className="font-mono text-[11px] font-bold tracking-wider uppercase text-buy mb-3">
            How it works
          </h2>
          <ol className="flex flex-col gap-2.5 mb-3">
            {HOW_IT_WORKS_STEPS.map((s, i) => (
              <li key={s.title} className="rounded-lg border border-outline bg-slate px-4 py-3 flex gap-3">
                <span className="material-symbols-outlined text-signal text-xl shrink-0" aria-hidden="true">
                  {s.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-chalk mb-0.5">
                    {i + 1}. {s.title}
                  </p>
                  <p className="text-xs text-chalk/70 leading-relaxed">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link href="/how-it-works" className="text-sm text-secondary hover:underline">
            See the full walkthrough →
          </Link>
        </section>

        {/* Example: the real readback for a real description */}
        <section aria-labelledby="example-heading">
          <h2 id="example-heading" className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-3">
            Example
          </h2>
          <div className="rounded-lg bg-ink border border-outline px-4 py-3.5 mb-2">
            <p className="font-mono text-[13px] text-chalk/75 leading-relaxed">
              <span className="text-signal">&gt;</span> &ldquo;{EXAMPLE}&rdquo;
            </p>
          </div>
          <p className="text-xs text-chalk/50 mb-2">This is what the app shows back before you build:</p>
          <div className="rounded-lg border border-outline bg-slate px-4 py-4 mb-3">
            <RulesReadback rules={EXAMPLE_RULES} />
          </div>
          <Link href="/demo" className="text-sm text-secondary hover:underline">
            See the full demo walkthrough →
          </Link>
        </section>

        {/* The problem it replaces */}
        <div>
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-3">
            The usual way
          </p>
          <p className="text-sm text-chalk/85 leading-relaxed mb-3">
            Turning a strategy into an automated system usually means hiring an MQL4/MQL5
            programmer:
          </p>
          <div className="rounded-lg border border-outline bg-slate px-4 py-3.5 mb-3">
            <ol className="flex flex-col gap-1.5 text-sm text-chalk/60">
              {OLD_WAY_STEPS.map((step, i) => (
                <li key={step} className="flex items-start gap-2">
                  <span className="font-mono text-xs text-chalk/40 mt-0.5 shrink-0">{i + 1}.</span>
                  <span className="line-through decoration-chalk/30">{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <Link href="/compare/ea-programmer-alternative" className="text-sm text-secondary hover:underline">
            See the full cost &amp; time comparison →
          </Link>
        </div>

        {/* Features */}
        <div>
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-3">
            Features
          </p>
          <div className="flex flex-col gap-3 mb-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-lg border border-outline bg-slate px-4 py-3.5 flex gap-3">
                <span className="material-symbols-outlined text-signal text-xl shrink-0">
                  {f.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-chalk mb-1">{f.title}</p>
                  <p className="text-xs text-chalk/70 leading-relaxed">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
          <Link href="/features" className="text-sm text-secondary hover:underline">
            See all features →
          </Link>
        </div>

        {/* Backtesting honesty note */}
        <div className="p-3 rounded-lg border border-caution bg-caution-bg/20">
          <p className="text-xs text-chalk/80 leading-relaxed">
            Before you download, a free logic check runs your exact rules through the bot&apos;s
            trade logic and explains every trade it takes — on a made-up price path, not real
            market history. It&apos;s not a backtest and not a promise of profitability.{" "}
            <Link href="/backtesting" className="text-secondary hover:underline">
              Read the honest answer →
            </Link>
          </p>
        </div>

        {/* Pricing */}
        <div>
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-3">
            Pricing
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-outline bg-slate px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-chalk/50 mb-2">
                Free
              </p>
              <p className="font-display font-bold text-2xl text-chalk mono-num mb-2">KES 0</p>
              <p className="text-xs text-chalk/70 leading-relaxed">
                Describe your strategy, run {FREE_SIMS} logic checks. No account needed.
              </p>
            </div>
            <div className="rounded-lg border border-signal/40 bg-slate px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-signal mb-2">Pro</p>
              <p className="font-display font-bold text-2xl text-chalk mono-num mb-2">
                KES {PRICE_KES.toLocaleString("en-KE")}
              </p>
              <p className="text-xs text-chalk/70 leading-relaxed">
                Unlimited strategies and .mq5 downloads for {PRO_DAYS} days.
              </p>
            </div>
          </div>
          <p className="text-sm text-chalk/70 mt-3">
            <Link href="/pricing" className="text-secondary hover:underline">
              See full pricing →
            </Link>
          </p>
          <p className="text-xs text-chalk/50 mt-2">
            We&apos;re in beta: payments aren&apos;t live yet, so Pro is free for now.
          </p>
        </div>

        {/* FAQ teaser */}
        <div>
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-2">
            Common questions
          </p>
          <p className="text-sm text-chalk/70 leading-relaxed mb-1">
            Do I need to know MQL5? Will this guarantee my strategy makes money? Do I need a VPS?
          </p>
          <Link href="/faq" className="text-sm text-secondary hover:underline">
            Read the full FAQ →
          </Link>
        </div>

        <CtaBanner />

        <p className="text-xs text-chalk/50 leading-relaxed">
          <span className="font-semibold text-chalk/70">Risk warning:</span> trading forex and CFDs
          on margin carries a high risk of losing money, including more than you deposit with some
          brokers. StratoBot builds the EA you describe; it doesn&apos;t give trading advice and
          can&apos;t make a strategy profitable. Test every EA on a demo account first.
        </p>

        <Footer />
      </main>
    </div>
  );
}
