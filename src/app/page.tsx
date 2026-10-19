import Image from "next/image";
import Link from "next/link";
import { CtaBanner } from "@/components/CtaBanner";
import { Footer } from "@/components/Footer";
import { EXAMPLE_STRATEGIES, FREE_SIMS, PRICE_KES } from "@/lib/constants";
import { TrackView } from "@/components/TrackView";
import { ExplainerVideo } from "@/components/ExplainerVideo";
import { TrackedLink } from "@/components/TrackedLink";
import { RulesReadback } from "@/components/RulesReadback";
import { SimulationChart } from "@/components/SimulationChart";
import { parsePrompt } from "@/lib/parser";
import { blocksToRules } from "@/lib/rules/from-blocks";
import { simulateRules } from "@/lib/rules/synthetic";
import { compileRules } from "@/lib/rules/compile-mql5";
import { buildMetadata } from "@/lib/seo";
import heroImage from "../../public/images/hero-trader-desk.jpg";

export const metadata = buildMetadata({
  title: "StratoBot AI — Turn Your Trading Strategy Into an EA",
  description: "Describe your trading strategy in plain language, review the logic, and download a real MetaTrader 5 Expert Advisor you can inspect and test. No MQL4/MQL5 programming, no hiring a programmer.",
  path: "/",
});

const NAV = [
  { href: "#how-it-works", label: "How it works" },
  { href: "/demo", label: "Demo" },
  { href: "/pricing", label: "Pricing" },
  { href: "/learn", label: "Learn" },
];

const STEPS = [
  { icon: "edit_note", title: "Describe it", body: "Write your entry and exit rules the way you'd explain them to another trader." },
  { icon: "fact_check", title: "Review the logic", body: "See exactly what the bot will do, rule by rule. Anything it can't build is flagged, not guessed." },
  { icon: "science", title: "Check it fires", body: "A free logic check runs your exact rules on a made-up price path and explains every trade." },
  { icon: "download", title: "Download the .mq5", body: "A real MQL5 source file you open, read, compile and test in MetaTrader 5." },
] as const;

const OLD_WAY = [
  "Write a technical spec",
  "Find an MQL4/MQL5 programmer",
  "Explain the strategy, repeatedly",
  "Pay upfront and wait 2 to 4+ weeks",
  "Test it yourself, request revisions, pay again",
];

const NEW_WAY = [
  "Describe the strategy in your own words",
  "Confirm a rule-by-rule readback",
  "Watch it trade on a free logic check",
  "Download the .mq5 the same day",
];

// Everything in the product preview is real output for the example strategy,
// produced at build time by the same parser, compiler and trade engine the app
// uses. Nothing in it is a mock-up or a performance claim.
const EXAMPLE = EXAMPLE_STRATEGIES[0];
const EXAMPLE_RULES = blocksToRules(parsePrompt(EXAMPLE).blocks);
const EXAMPLE_CHECK = (() => {
  for (let run = 0; run < 8; run++) {
    const r = simulateRules(EXAMPLE_RULES, run);
    if (r.trades.length >= 2) return r;
  }
  return simulateRules(EXAMPLE_RULES, 0);
})();
const EXAMPLE_TRADE = EXAMPLE_CHECK.trades.find((t) => t.exitWhy) ?? EXAMPLE_CHECK.trades[0];
const MQL5_EXCERPT = compileRules(EXAMPLE_RULES, { name: "9/21 EMA cross", id: "example", updatedAt: 0 })
  .split("\n")
  .filter((line) => /^input \w+\s+(Ma\d+_Period|InpLots|InpStopLossPips|InpTakeProfitPips)\b/.test(line))
  .map((line) => line.replace(/\s+/g, " "));

function ProductPreview() {
  return (
    <div className="rounded-2xl border border-outline bg-slate shadow-lift overflow-hidden text-left">
      <div className="flex items-center justify-between gap-3 px-4 md:px-5 py-3 border-b border-outline">
        <span className="font-display text-lg text-chalk">StratoBot</span>
        <span className="hidden sm:flex items-center gap-1 rounded-full bg-slate-high px-1 py-1 text-xs text-chalk/70">
          {["Describe", "Review", "Check", "Download"].map((s, i) => (
            <span key={s} className={`rounded-full px-3 py-1 ${i === 1 ? "bg-signal text-on-signal" : ""}`}>
              {s}
            </span>
          ))}
        </span>
      </div>
      <div className="grid md:grid-cols-[1.05fr_1fr]">
        <div className="min-w-0 p-4 md:p-6 md:border-r border-outline">
          <p className="text-xs text-chalk/50 mb-1">You wrote</p>
          <p className="text-sm text-chalk mb-4">&ldquo;{EXAMPLE}&rdquo;</p>
          <div className="rounded-xl bg-ink/60 border border-outline px-4 py-4">
            <RulesReadback rules={EXAMPLE_RULES} />
          </div>
        </div>
        <div className="min-w-0 p-4 md:p-6 border-t md:border-t-0 border-outline flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-chalk">Free logic check</p>
            <p className="text-xs text-chalk/55">
              {EXAMPLE_CHECK.trades.length} trades over {EXAMPLE_CHECK.candles.length} candles of a made-up price path
            </p>
          </div>
          <SimulationChart result={EXAMPLE_CHECK} />
          {EXAMPLE_TRADE?.why && (
            <div className="rounded-xl border border-outline px-3.5 py-3">
              <p className="text-xs font-semibold text-chalk mb-1.5">
                Why the {EXAMPLE_TRADE.direction} on candle {EXAMPLE_TRADE.candle + 1} happened
              </p>
              <ul className="flex flex-col gap-1 text-xs text-chalk/75 leading-relaxed">
                {EXAMPLE_TRADE.why.map((w) => (
                  <li key={w}>{w}</li>
                ))}
                {EXAMPLE_TRADE.exitWhy && <li className="text-chalk/60">{EXAMPLE_TRADE.exitWhy}</li>}
              </ul>
            </div>
          )}
        </div>
      </div>
      <p className="px-4 md:px-5 py-3 border-t border-outline text-xs text-chalk/60 text-center">
        Real output for this example. The logic check uses a made-up price path, not market
        history, and isn&apos;t a backtest or a profit forecast.
      </p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="flex flex-col flex-1">
      <TrackView event="landing_page_view" />

      {/* Hero, over a soft trader's-desk photograph */}
      <div className="relative isolate overflow-hidden">
        <Image
          src={heroImage}
          alt=""
          priority
          placeholder="blur"
          sizes="100vw"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-bottom opacity-90 dark:opacity-25"
        />
        {/* Fade the photo in behind the headline and out into the page below. */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/95 via-ink/45 to-transparent" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-40 -z-10 bg-gradient-to-t from-ink to-transparent" aria-hidden="true" />

        <header className="mx-auto max-w-6xl px-5 md:px-8 h-[68px] flex items-center justify-between gap-4">
          <Link href="/" className="font-display text-2xl text-chalk">
            StratoBot
          </Link>
          <nav aria-label="Main" className="hidden md:flex items-center gap-8 text-[15px] text-chalk/80">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="hover:text-chalk">
                {n.label}
              </a>
            ))}
          </nav>
          <TrackedLink href="/app" event="primary_cta_clicked" props={{ location: "nav" }} className="!rounded-full !px-5 !py-2.5 !min-h-[40px] text-sm">
            Build My EA
          </TrackedLink>
        </header>

        <section className="mx-auto max-w-6xl px-5 md:px-8 pt-10 md:pt-16 pb-16 md:pb-24 text-center">
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-full border border-outline bg-slate/80 backdrop-blur px-1.5 py-1 pr-3.5 text-xs md:text-sm text-chalk/80 shadow-soft"
          >
            <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-on-signal">New</span>
            A free logic check that explains every trade
          </a>

          <h1 className="font-display text-[38px] leading-[1.04] sm:text-5xl md:text-7xl md:leading-[0.98] mt-6 mb-5">
            <span className="block text-chalk/45">Your trading strategy.</span>
            <span className="block text-chalk">Your EA. No coding required.</span>
          </h1>
          <p className="mx-auto max-w-[34rem] text-base md:text-lg text-chalk/70 leading-relaxed mb-8">
            Turn your forex trading rules into an Expert Advisor for MetaTrader&nbsp;5. Describe your
            strategy, review the logic, and download code you can inspect and test.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-sm sm:max-w-none mx-auto">
            <TrackedLink href="/app" event="primary_cta_clicked" props={{ location: "hero" }} className="!rounded-full !px-7">
              Build My EA
            </TrackedLink>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-3 rounded-full border border-outline bg-slate/80 backdrop-blur text-chalk font-semibold text-[15px] pl-6 pr-2 py-2 min-h-[44px] hover:bg-slate focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
            >
              See How It Works
              <span className="material-symbols-outlined rounded-full bg-slate-high p-1.5 text-lg" aria-hidden="true">
                south
              </span>
            </a>
          </div>

          <div className="mx-auto mt-14 md:mt-20 max-w-5xl">
            <ProductPreview />
          </div>
        </section>
      </div>

      <main className="mx-auto w-full max-w-6xl px-5 md:px-8 flex flex-col gap-20 md:gap-28 py-16 md:py-24">
        {/* How it works: a four-step sequence */}
        <section id="how-it-works" aria-labelledby="how-heading" className="scroll-mt-6">
          <h2 id="how-heading" className="font-display text-4xl md:text-5xl text-chalk mb-3">
            How it works
          </h2>
          <p className="text-chalk/65 max-w-[38rem] mb-8">
            Four steps, all in your browser. You only need MetaTrader 5 at the end.
          </p>
          <div className="max-w-4xl mb-14">
            <ExplainerVideo />
          </div>
          <ol className="grid gap-8 md:grid-cols-4 md:gap-6">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative md:pt-6 md:border-t border-outline">
                <span className="material-symbols-outlined text-accent text-2xl mb-3 block" aria-hidden="true">
                  {s.icon}
                </span>
                <p className="font-semibold text-chalk mb-1.5">
                  <span className="text-chalk/40 mr-1.5">{i + 1}.</span>
                  {s.title}
                </p>
                <p className="text-sm text-chalk/65 leading-relaxed">{s.body}</p>
              </li>
            ))}
          </ol>
          <Link href="/how-it-works" className="inline-block mt-8 text-sm text-chalk/80 underline underline-offset-4 decoration-outline-variant hover:decoration-chalk">
            See the full walkthrough
          </Link>
        </section>

        {/* The usual way vs. StratoBot */}
        <section aria-labelledby="compare-heading" className="grid md:grid-cols-2 gap-6">
          <h2 id="compare-heading" className="sr-only">
            Hiring a programmer compared with StratoBot
          </h2>
          <div className="rounded-2xl border border-outline px-6 py-7">
            <p className="font-display text-2xl text-chalk/50 mb-5">Hiring a programmer</p>
            <ul className="flex flex-col gap-3 text-chalk/55">
              {OLD_WAY.map((s) => (
                <li key={s} className="line-through decoration-chalk/25">
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-slate shadow-soft border border-outline px-6 py-7">
            <p className="font-display text-2xl text-chalk mb-5">With StratoBot</p>
            <ul className="flex flex-col gap-3 text-chalk/85">
              {NEW_WAY.map((s) => (
                <li key={s} className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-buy text-lg" aria-hidden="true">
                    check
                  </span>
                  {s}
                </li>
              ))}
            </ul>
            <Link
              href="/compare/ea-programmer-alternative"
              className="inline-block mt-6 text-sm text-chalk/80 underline underline-offset-4 decoration-outline-variant hover:decoration-chalk"
            >
              See the full cost and time comparison
            </Link>
          </div>
        </section>

        {/* What you get: code you can read */}
        <section aria-labelledby="code-heading" className="grid md:grid-cols-[1fr_1.1fr] gap-10 items-center">
          <div className="min-w-0">
            <h2 id="code-heading" className="font-display text-4xl md:text-5xl text-chalk mb-4">
              Code you can read, not a black box
            </h2>
            <p className="text-chalk/70 leading-relaxed mb-6 max-w-[34rem]">
              Your rules are compiled by a deterministic compiler, not written freeform by AI, and
              the compiler is checked against MetaTrader 5&apos;s own Strategy Tester. Every
              setting you described becomes an input you can change in MetaTrader.
            </p>
            <ul className="flex flex-col gap-2.5 text-sm text-chalk/80">
              <li className="flex gap-2.5"><span className="material-symbols-outlined text-accent text-lg" aria-hidden="true">code</span>An ordinary .mq5 source file, yours to keep and edit</li>
              <li className="flex gap-2.5"><span className="material-symbols-outlined text-accent text-lg" aria-hidden="true">tune</span>Stops, targets and sizes exposed as inputs</li>
              <li className="flex gap-2.5"><span className="material-symbols-outlined text-accent text-lg" aria-hidden="true">lock_open</span>Nothing locked to our platform</li>
            </ul>
          </div>
          <figure className="min-w-0 rounded-2xl bg-[#2a2824] text-[#ece7dc] shadow-lift overflow-hidden">
            <figcaption className="px-5 py-3 border-b border-white/10 text-xs text-[#ece7dc]/60 font-mono">
              9-21-ema-cross.mq5 (inputs, real excerpt)
            </figcaption>
            <pre className="px-5 py-5 text-[12.5px] leading-relaxed font-mono overflow-x-auto">
              {MQL5_EXCERPT.join("\n")}
            </pre>
          </figure>
        </section>

        {/* Pricing */}
        <section aria-labelledby="pricing-heading">
          <h2 id="pricing-heading" className="font-display text-4xl md:text-5xl text-chalk mb-3">
            Simple pricing
          </h2>
          <p className="text-chalk/65 mb-8">
            We&apos;re in beta: payments aren&apos;t live yet, so Pro is free for now.
          </p>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
            <div className="rounded-2xl border border-outline px-6 py-7">
              <p className="text-sm font-semibold text-chalk/60 mb-2">Free</p>
              <p className="font-display text-4xl text-chalk mb-3">KES 0</p>
              <p className="text-sm text-chalk/70 leading-relaxed">
                Describe your strategy, review the rules and run {FREE_SIMS} logic checks. No
                account needed.
              </p>
            </div>
            <div className="rounded-2xl bg-slate shadow-soft border border-outline px-6 py-7">
              <p className="text-sm font-semibold text-accent mb-2">Pro</p>
              <p className="font-display text-4xl text-chalk mb-3">
                <span>KES {PRICE_KES.toLocaleString("en-KE")}</span>
                <span className="font-body text-base text-chalk/60"> / month</span>
                <span className="font-body text-sm text-buy ml-2 align-middle">free during beta</span>
              </p>
              <p className="text-sm text-chalk/70 leading-relaxed">
                Unlimited strategies, logic checks and .mq5 downloads, every month.
              </p>
            </div>
          </div>
          <Link href="/pricing" className="inline-block mt-6 text-sm text-chalk/80 underline underline-offset-4 decoration-outline-variant hover:decoration-chalk">
            See full pricing
          </Link>
        </section>

        <div className="max-w-2xl mx-auto w-full">
          <CtaBanner />
        </div>

        <p className="text-xs text-chalk/55 leading-relaxed max-w-3xl">
          <span className="font-semibold text-chalk/70">Risk warning:</span> trading forex and CFDs
          on margin carries a high risk of losing money, including more than you deposit with some
          brokers. StratoBot builds the EA you describe; it doesn&apos;t give trading advice and
          can&apos;t make a strategy profitable. Test every EA on a demo account first.{" "}
          <Link href="/faq" className="underline underline-offset-2">
            Read the FAQ
          </Link>
        </p>

        <Footer />
      </main>
    </div>
  );
}
