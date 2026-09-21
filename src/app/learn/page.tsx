import Link from "next/link";
import { Header } from "@/components/Header";

export const metadata = {
  title: "Learn — StratoBot AI",
  description: "Reference guides on Expert Advisors, MQL4 vs MQL5, algorithmic trading, and automating a strategy without coding.",
};

const ARTICLES = [
  {
    href: "/learn/what-is-an-expert-advisor",
    title: "What Is an Expert Advisor (EA)?",
    body: "The basics of what an EA actually is and how it trades on your behalf.",
  },
  {
    href: "/learn/mql4-vs-mql5",
    title: "MQL4 vs MQL5: What's the Difference?",
    body: "The real architectural differences between the two languages — and why they matter.",
  },
  {
    href: "/learn/what-is-algorithmic-trading",
    title: "What Is Algorithmic Trading?",
    body: "How rules-based automated trading actually works, and what it doesn't promise.",
  },
  {
    href: "/learn/pips-lots-leverage-explained",
    title: "Pips, Lots, and Leverage Explained",
    body: "The units every position-sizing and risk calculation depends on.",
  },
  {
    href: "/learn/common-automation-mistakes",
    title: "Common Mistakes When Automating a Strategy",
    body: "The gaps that turn a good manual strategy into a broken EA.",
  },
];

export default function LearnPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="Learn" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">Learn</h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            Reference guides on the concepts behind automated trading — evergreen, not
            time-sensitive.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {ARTICLES.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="rounded-lg border border-outline bg-slate px-4 py-3.5 hover:border-signal/50 transition-colors"
            >
              <p className="text-sm font-semibold text-chalk mb-1">{a.title}</p>
              <p className="text-xs text-chalk/70 leading-relaxed">{a.body}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
