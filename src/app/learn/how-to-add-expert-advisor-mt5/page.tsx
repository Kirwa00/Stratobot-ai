import Link from "next/link";
import { ArticleFaq, ArticleSection, ArticleShell, ArticleSteps } from "@/components/ArticleShell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "How to Add an Expert Advisor to MT5 (and Run It) — StratoBot AI",
  description:
    "Step by step: where to put an EA file in MetaTrader 5, how to compile it, attach it to a chart, turn on Algo Trading, and fix an EA that isn't trading.",
  path: "/learn/how-to-add-expert-advisor-mt5",
});

const STEPS = [
  {
    title: "Check what file you have",
    body: (
      <>
        MT5 runs <code>.ex5</code> files (compiled) and compiles <code>.mq5</code> files (source).{" "}
        <code>.ex4</code> and <code>.mq4</code> files are for MetaTrader 4 and won&apos;t run in MT5 — see{" "}
        <Link href="/learn/convert-mt4-ea-to-mt5" className="text-secondary hover:underline">
          converting an MT4 EA
        </Link>
        .
      </>
    ),
  },
  {
    title: "Copy it into the Experts folder",
    body: "In MT5 go to File → Open Data Folder, then open MQL5 → Experts and paste the file there. Using the Data Folder menu matters: MT5 often keeps its files somewhere other than its install folder.",
  },
  {
    title: "Compile it (for .mq5 files)",
    body: "Open the file in MetaEditor (press F4 in MT5, then open it) and press F7 or click Compile. The Errors tab at the bottom should say 0 errors; that creates the .ex5 file MT5 actually runs. An .ex5 file skips this step.",
  },
  {
    title: "Refresh the Navigator",
    body: "Back in MT5, open the Navigator (Ctrl+N), right-click Expert Advisors and choose Refresh. Your EA appears in the list.",
  },
  {
    title: "Attach it to the right chart",
    body: "Open a chart of the symbol and timeframe the EA was built for, then drag the EA from the Navigator onto the chart (or double-click it).",
  },
  {
    title: "Allow Algo Trading and set its inputs",
    body: "In the window that opens, tick Allow Algo Trading on the Common tab, review the settings on the Inputs tab (lot size, stops, and so on), then click OK.",
  },
  {
    title: "Turn on Algo Trading in the toolbar",
    body: "Click the Algo Trading button in MT5's main toolbar so it's switched on. Without it, no EA on any chart can place trades, even with the box ticked in step 6.",
  },
  {
    title: "Check the Experts and Journal tabs",
    body: "Open the Toolbox (Ctrl+T). The Experts tab shows messages from the EA itself; the Journal shows platform errors such as rejected orders.",
  },
];

const TROUBLESHOOTING = [
  { title: "It's not in the Navigator", body: "The file is in the wrong folder (use File → Open Data Folder), an .mq5 file hasn't been compiled, or the list needs a Refresh." },
  { title: "It's attached but never trades", body: "Check the Algo Trading button, whether the market is open, and whether the EA's conditions have actually occurred yet. A rules-based EA can go days without a signal." },
  { title: "Orders get rejected", body: "The Journal tab says why. Common causes: a lot size below your broker's minimum, stops too close to price, or an account that doesn't allow automated trading." },
  { title: "It stops when you close MT5", body: <>An EA only runs while MT5 is open and connected. To keep it trading around the clock, run MT5 on a <Link href="/vps" className="text-secondary hover:underline">VPS</Link>.</> },
];

const FAQ = [
  { q: "Where do I put an EA file in MT5?", a: "In MT5, choose File → Open Data Folder, then MQL5 → Experts. Paste the .mq5 or .ex5 file there and refresh the Navigator." },
  { q: "Why is my Expert Advisor not trading in MT5?", a: "Most often the Algo Trading button is off, Allow Algo Trading wasn't ticked when attaching it, the market is closed, or the EA's entry conditions simply haven't occurred. The Experts and Journal tabs show the reason." },
  { q: "Can I add an EA on the MT5 mobile app?", a: "No. The MT5 mobile apps can't run Expert Advisors. You need the desktop version of MT5 or a VPS, and you can then watch the trades from your phone." },
];

export default function AddExpertAdvisorPage() {
  return (
    <ArticleShell
      backTitle="Learn"
      title="How to add an Expert Advisor to MT5"
      intro="Installing an EA in MetaTrader 5 takes a few minutes: put the file in the right folder, compile it, attach it to a chart and switch on Algo Trading. Here's each step, plus what to check when an EA won't trade."
    >
      <ArticleSection title="Step by step">
        <ArticleSteps steps={STEPS} />
      </ArticleSection>

      <ArticleSection title="If it isn't working">
        <ArticleSteps steps={TROUBLESHOOTING} />
      </ArticleSection>

      <ArticleSection title="Before you run it on a live account">
        <p>
          Run any new EA on a demo account first, and ideally through MT5&apos;s Strategy Tester before that.{" "}
          <Link href="/learn/how-to-backtest-an-ea-in-mt5" className="text-secondary hover:underline">
            How to backtest an EA in MT5
          </Link>{" "}
          walks through it.
        </p>
      </ArticleSection>

      <ArticleFaq items={FAQ} />

      <p className="text-sm text-chalk/70 text-center">
        Don&apos;t have an EA yet?{" "}
        <Link href="/how-to-create-mt5-ea" className="text-secondary hover:underline">
          Create one from your own strategy
        </Link>
      </p>
    </ArticleShell>
  );
}
