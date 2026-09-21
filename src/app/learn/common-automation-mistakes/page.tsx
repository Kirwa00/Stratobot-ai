import Link from "next/link";
import { ArticleShell } from "@/components/ArticleShell";

export const metadata = {
  title: "Common Mistakes When Automating a Strategy — StratoBot AI",
  description: "The gaps that most often turn a working manual strategy into a broken or dangerous EA.",
};

const MISTAKES = [
  {
    title: "Leaving out the exit rules",
    body: "Manual traders often 'just know' when to get out based on feel. An EA has no feel — if the exit isn't explicitly defined, it either never closes the trade or closes it on the wrong condition.",
  },
  {
    title: "No stop-loss at all",
    body: "The single most common way an automated strategy turns into an account-blower. Every rule set needs an explicit hard stop, not an assumption that price will come back.",
  },
  {
    title: "Fixed lot size instead of risk-based sizing",
    body: "A flat 0.1 lots on every trade means your actual risk swings with every different stop-loss distance. Sizing by a fixed % of account risk keeps every trade's downside comparable.",
  },
  {
    title: "Ambiguous conditions",
    body: "\"Enter near support\" isn't a rule a program can execute — how near? Automating a strategy forces the vague parts of it into specifics, which is often where people discover the strategy wasn't as well-defined as it felt.",
  },
  {
    title: "Assuming a logic check is a backtest",
    body: "Confirming an EA's rules fire correctly is not the same as confirming the strategy is profitable historically. Conflating the two leads to false confidence before going live.",
  },
  {
    title: "No plan for when MetaTrader isn't running",
    body: "An EA only works while the terminal is open and connected. Running it on a laptop that sleeps or shuts down means it silently stops watching the market with no warning.",
  },
];

export default function CommonAutomationMistakesPage() {
  return (
    <ArticleShell
      backTitle="Learn"
      title="Common mistakes when automating a strategy"
      intro="Most of these aren't coding mistakes — they're gaps in the strategy itself that only become obvious once it has to be specified precisely enough for a machine to execute."
    >
      <div className="flex flex-col gap-3">
        {MISTAKES.map((m, i) => (
          <div key={m.title} className="rounded-lg border border-outline bg-slate px-4 py-3.5 flex gap-3">
            <span className="font-mono text-xs text-chalk/40 mt-0.5 shrink-0">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <p className="text-sm font-semibold text-chalk mb-1">{m.title}</p>
              <p className="text-xs text-chalk/70 leading-relaxed">{m.body}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm text-chalk/70 text-center">
        <Link href="/risk-management" className="text-secondary hover:underline">
          Risk management basics
        </Link>{" "}
        · <Link href="/how-it-works" className="text-secondary hover:underline">
          How StratoBot flags what it couldn&apos;t map
        </Link>
      </p>
    </ArticleShell>
  );
}
