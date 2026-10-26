import Link from "next/link";
import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";
import { buildMetadata } from "@/lib/seo";
import { RulesReadback } from "@/components/RulesReadback";
import { ExplainerVideo } from "@/components/ExplainerVideo";
import { EXAMPLE_STRATEGIES, PRICE_PER_EA } from "@/lib/constants";
import { parsePrompt } from "@/lib/parser";
import { blocksToRules } from "@/lib/rules/from-blocks";

const EXAMPLE = EXAMPLE_STRATEGIES[0];
// Produced by the same parser and compiler the live app uses, so the demo shows real output.
const EXAMPLE_RULES = blocksToRules(parsePrompt(EXAMPLE).blocks);

export const metadata = buildMetadata({
  title: "See StratoBot in Action — Demo Walkthrough",
  description: "A full walkthrough of turning one real strategy into an MT5 EA with StratoBot, screen by screen.",
  path: "/demo",
});

const STAGES = [
  {
    n: "01",
    icon: "edit_note",
    title: "You describe it",
    body: `"${EXAMPLE}"`,
    isQuote: true,
  },
  {
    n: "02",
    icon: "fact_check",
    title: "StratoBot shows what the bot will do",
    body: "A rule-by-rule readback generated from the exact rules that get compiled (shown below for this example). Anything it couldn't build is flagged, and one-sided bots or missing exits get a warning.",
  },
  {
    n: "03",
    icon: "widgets",
    title: "Adjust it",
    body: "Reword your description, or edit the rules as blocks: change parameters, reorder, add what the description missed.",
  },
  {
    n: "04",
    icon: "science",
    title: "Free logic check",
    body: "Your exact rules run through the same trade logic as the EA on a made-up price path. You see every trade it took, why it opened, and how it closed. Not a backtest, not a profit forecast.",
  },
  {
    n: "05",
    icon: "lock_open",
    title: "Unlock",
    body: `Your first EA is free. After that, each one is ${PRICE_PER_EA}.`,
  },
  {
    n: "06",
    icon: "download",
    title: "Real .mq5 file",
    body: "Download an MQL5 source file you can read, compile in MetaEditor, and test in MetaTrader 5's Strategy Tester before using it on a demo account.",
  },
];

export default function DemoPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="Demo" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">
            See StratoBot turn a real strategy into an EA
          </h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            One example, start to finish — the same screens you&apos;ll see when you try it
            yourself.
          </p>
        </div>

        <ExplainerVideo />

        <div className="flex flex-col gap-3">
          {STAGES.map((s) => (
            <div key={s.n} className="rounded-lg border border-outline bg-slate px-4 py-3.5 flex gap-3">
              <span className="material-symbols-outlined text-signal text-xl shrink-0">
                {s.icon}
              </span>
              <div>
                <p className="text-sm font-semibold text-chalk mb-1">
                  {s.n} · {s.title}
                </p>
                {s.isQuote ? (
                  <p className="font-mono text-[13px] text-chalk/70 leading-relaxed">
                    <span className="text-signal">&gt;</span> {s.body}
                  </p>
                ) : (
                  <p className="text-xs text-chalk/70 leading-relaxed">{s.body}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <section aria-labelledby="demo-readback">
          <h2 id="demo-readback" className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-2">
            Step 02 for this example, as the app shows it
          </h2>
          <div className="rounded-lg border border-outline bg-slate px-4 py-4">
            <RulesReadback rules={EXAMPLE_RULES} />
          </div>
        </section>

        <div className="p-3 rounded-lg border border-caution bg-caution-bg/20">
          <p className="text-xs text-chalk/80 leading-relaxed">
            This is a demonstration of the live flow with one example strategy. Nothing here is a
            trading result: the logic check uses a made-up price path and isn&apos;t evidence that
            any strategy will be profitable.
          </p>
        </div>

        <p className="text-sm text-chalk/70 text-center">
          Downloaded EA needs MT5 running around the clock?{" "}
          <Link href="/vps" className="text-secondary hover:underline">
            Compare VPS providers
          </Link>
        </p>

        <CtaBanner
          title="Try it with your own strategy"
          body="No account needed for the free logic check."
        />
      </main>
    </div>
  );
}
