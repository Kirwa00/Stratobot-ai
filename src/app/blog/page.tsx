import Link from "next/link";
import { Header } from "@/components/Header";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Blog — StratoBot AI",
  description: "Updates and thinking from the team building StratoBot.",
  path: "/blog",
});

const POSTS = [
  {
    href: "/blog/stratobot-beta-launch",
    date: "September 21, 2026",
    title: "StratoBot is in private beta — here's what we're testing",
    body: "Why we opened a beta, what free 30-day access gets you, and what we're trying to learn from it.",
  },
  {
    href: "/blog/why-we-dont-call-it-an-ai-trading-bot",
    date: "September 21, 2026",
    title: "Why we don't call StratoBot an \"AI trading bot\"",
    body: "The AI maps your words to code blocks. It doesn't trade, and it doesn't decide what's profitable.",
  },
  {
    href: "/blog/real-cost-of-hiring-an-mql5-programmer",
    date: "September 21, 2026",
    title: "The real cost of hiring an MQL5 programmer",
    body: "What freelance marketplaces actually charge and how long it actually takes, sourced from public listings.",
  },
];

export default function BlogPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="Blog" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">Blog</h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            We just started this — expect it to grow slowly and honestly rather than all at once.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {POSTS.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="rounded-lg border border-outline bg-slate px-4 py-3.5 hover:border-signal/50 transition-colors"
            >
              <p className="text-[10px] font-mono uppercase tracking-wide text-chalk/40 mb-1.5">
                {p.date}
              </p>
              <p className="text-sm font-semibold text-chalk mb-1">{p.title}</p>
              <p className="text-xs text-chalk/70 leading-relaxed">{p.body}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
