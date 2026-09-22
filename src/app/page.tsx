import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { CtaBanner } from "@/components/CtaBanner";
import { FREE_SIMS, PRO_DAYS, PRICE_KES } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "StratoBot AI — Turn Your Trading Strategy Into an EA",
  description: "Describe your trading strategy in plain language. StratoBot builds a real MetaTrader 5 Expert Advisor — no MQL4/MQL5 programming, no hiring a programmer.",
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
  { icon: "edit_note", label: "Describe" },
  { icon: "science", label: "Check it" },
  { icon: "lock_open", label: "Unlock" },
  { icon: "download", label: "Download" },
] as const;

const FEATURES = [
  { icon: "edit_note", title: "Plain-language input", body: "No technical spec required — describe entries, exits, and risk rules like you'd explain them to another trader." },
  { icon: "code", title: "Deterministic MQL5", body: "Assembled from hand-written, pre-tested templates — never freeform AI-generated code." },
  { icon: "download", title: "Real, compilable output", body: "An actual .mq5 file you open in MetaEditor, compile, and run — nothing locked to our platform." },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-8">
        {/* Hero */}
        <div>
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-signal mb-2">
            Strategy → EA
          </p>
          <h1 className="font-display font-bold text-2xl text-chalk mb-3">
            Turn your trading strategy into an Expert Advisor
          </h1>
          <p className="text-sm text-chalk/70 leading-relaxed mb-5">
            No MQL4/MQL5 programming required — and no hiring a programmer. You create the
            strategy. StratoBot creates the EA.
          </p>
          <Link href="/app">
            <Button className="w-full">Describe your strategy — free</Button>
          </Link>
        </div>

        {/* Problem */}
        <div>
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-3">
            The problem
          </p>
          <p className="text-sm text-chalk/85 leading-relaxed mb-3">
            You have a strategy, but turning it into an automated system usually means hiring an
            MQL4/MQL5 programmer:
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

        {/* How it works */}
        <div>
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-buy mb-3">
            How it works
          </p>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {HOW_IT_WORKS_STEPS.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1.5 text-center">
                <span className="material-symbols-outlined text-signal text-xl">{s.icon}</span>
                <span className="text-xs font-medium text-chalk">{s.label}</span>
              </div>
            ))}
          </div>
          <Link href="/how-it-works" className="text-sm text-secondary hover:underline">
            See the full walkthrough →
          </Link>
        </div>

        {/* Example strategy → EA output */}
        <div>
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-3">
            Example
          </p>
          <div className="rounded-lg bg-ink border border-outline px-4 py-4 mb-3">
            <p className="font-mono text-[13px] text-chalk/70 leading-relaxed">
              <span className="text-signal">&gt;</span> &ldquo;London killzone, sweep PDH, enter on
              50% retrace, trail stop 30 pips&rdquo;
            </p>
          </div>
          <p className="text-sm text-chalk/85 leading-relaxed mb-2">
            Becomes a real <code className="text-signal">.mq5</code> file — a session-time
            filter, prior-day-high sweep detection, a 50% retracement entry, and a 30-pip
            trailing stop, all assembled from tested code blocks, not freeform AI code.
          </p>
          <Link href="/demo" className="text-sm text-secondary hover:underline">
            See the full demo walkthrough →
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
            Before you download, a free logic check confirms your rules fire the way you
            described — on a synthetic price path, not real market history. It&apos;s not a
            backtest and not a promise of profitability.{" "}
            <Link href="/backtesting" className="text-secondary hover:underline">
              Read the honest answer →
            </Link>
          </p>
        </div>

        {/* Pricing */}
        <div className="rounded-lg border border-outline bg-slate px-4 py-3.5">
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-1.5">
            Pricing
          </p>
          <p className="text-sm text-chalk/85 leading-relaxed">
            Free to describe your strategy and run {FREE_SIMS} logic checks. KES{" "}
            {PRICE_KES.toLocaleString("en-KE")} unlocks unlimited strategies and downloads for{" "}
            {PRO_DAYS} days.{" "}
            <Link href="/pricing" className="text-secondary hover:underline">
              See full pricing →
            </Link>
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
      </main>
    </div>
  );
}
