import Link from "next/link";
import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Hiring an MQL5 Programmer — What to Expect",
  description:
    "What it actually involves to hire an MQL5 programmer to build your Expert Advisor, and how StratoBot skips the process.",
  path: "/compare/mql5-programmer",
});

const CHECKLIST = [
  {
    title: "Finding someone",
    body: "Search a general marketplace (Upwork, Fiverr) or a specialized one (MQL5.com's own freelance section). Rates on general platforms run from around $10/hr up; specialists on niche platforms often charge $60–100+/hr.",
  },
  {
    title: "Writing a spec",
    body: "You need to describe entries, exits, stop-loss, take-profit, position sizing, and edge cases precisely enough that someone who has never seen your strategy can code it correctly on the first try — which rarely happens.",
  },
  {
    title: "Vetting the developer",
    body: "Reviewing past work, checking reviews, sometimes running a small paid test task before committing to the full build.",
  },
  {
    title: "The build itself",
    body: "Commonly quoted at 2–4 weeks for an initial version; longer once revisions are factored in.",
  },
  {
    title: "Testing and revisions",
    body: "You test what they deliver, find gaps between what you meant and what they built, and go through one or more paid revision rounds.",
  },
  {
    title: "Ongoing changes",
    body: "Want to tweak a rule six months later? That's typically a new paid engagement, possibly with a different developer who has to relearn your strategy from scratch.",
  },
];

export default function Mql5ProgrammerPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="Compare" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">
            Hiring an MQL5 programmer: what to expect
          </h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            If you&apos;re considering hiring someone to code your strategy, here&apos;s the
            realistic process — so you can compare it honestly to describing it to StratoBot
            instead.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {CHECKLIST.map((c, i) => (
            <div key={c.title} className="rounded-lg border border-outline bg-slate px-4 py-3.5 flex gap-3">
              <span className="font-mono text-xs text-chalk/40 mt-0.5 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="text-sm font-semibold text-chalk mb-1">{c.title}</p>
                <p className="text-xs text-chalk/70 leading-relaxed">{c.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-signal/40 bg-slate px-4 py-3.5">
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-signal mb-1.5">
            The StratoBot version
          </p>
          <p className="text-sm text-chalk/85 leading-relaxed">
            Skip the search, the spec-writing, and the back-and-forth: describe your strategy in
            plain language, see a read-back of what StratoBot understood, and get a real .mq5 file
            when you&apos;re happy with it — with unlimited regenerations while your pass is
            active.
          </p>
        </div>

        <div className="p-3 rounded-lg border border-caution bg-caution-bg/20">
          <p className="text-xs text-chalk/80 leading-relaxed">
            Figures above are general ranges drawn from public freelance marketplaces, not
            guaranteed quotes. For strategies with genuinely novel logic outside StratoBot&apos;s
            block library, a human programmer may still be the right call.
          </p>
        </div>

        <p className="text-sm text-chalk/70 text-center">
          <Link href="/compare/ea-programmer-alternative" className="text-secondary hover:underline">
            See the full cost/time comparison
          </Link>
        </p>

        <CtaBanner />
      </main>
    </div>
  );
}
