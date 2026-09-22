import Link from "next/link";
import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";
import { PRO_DAYS, PRICE_KES } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "StratoBot vs. Hiring an EA Programmer",
  description:
    "Comparing StratoBot to hiring a freelance MQL4/MQL5 programmer to build your Expert Advisor: cost, time, revisions, and ownership.",
  path: "/compare/ea-programmer-alternative",
});

const ROWS = [
  {
    label: "Typical cost",
    programmer: "~$150–$500+ USD for a real strategy with entries/exits/risk rules (simple mods run $30–$200); rates vary widely by platform and developer.",
    stratobot: `KES ${PRICE_KES.toLocaleString("en-KE")} for ${PRO_DAYS} days of unlimited strategies and downloads.`,
  },
  {
    label: "Typical timeline",
    programmer: "Often quoted as 2–4 weeks for a first draft, commonly 4–6+ weeks once revisions are included.",
    stratobot: "Minutes, from description to a compilable .mq5 file.",
  },
  {
    label: "Revisions",
    programmer: "Usually cost extra time and sometimes extra money per round.",
    stratobot: "Re-describe or adjust blocks and regenerate as many times as you want while unlocked.",
  },
  {
    label: "Explaining your strategy",
    programmer: "You write a spec and go back and forth until the programmer understands it correctly.",
    stratobot: "You describe it once in plain language; StratoBot shows a read-back so you can correct misunderstandings immediately.",
  },
  {
    label: "Code ownership",
    programmer: "Varies by contract — some freelancers retain rights or reuse code across clients.",
    stratobot: "You get the real .mq5 source file, yours to keep, edit, or hand to anyone.",
  },
  {
    label: "Ongoing maintenance",
    programmer: "Usually a new paid engagement each time you want a change.",
    stratobot: "Included for as long as your pass is active.",
  },
];

export default function EaProgrammerAlternativePage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="Compare" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">
            StratoBot vs. hiring an EA programmer
          </h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            The biggest practical alternative to StratoBot isn&apos;t another bot generator —
            it&apos;s hiring a freelance MQL4/MQL5 developer. Here&apos;s an honest comparison.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {ROWS.map((r) => (
            <div key={r.label} className="rounded-lg border border-outline bg-slate px-4 py-3.5">
              <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-2">
                {r.label}
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wide text-chalk/40 border border-outline rounded px-1.5 py-0.5 shrink-0 mt-0.5">
                    Programmer
                  </span>
                  <p className="text-sm text-chalk/70 leading-relaxed">{r.programmer}</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wide text-signal border border-signal/40 rounded px-1.5 py-0.5 shrink-0 mt-0.5">
                    StratoBot
                  </span>
                  <p className="text-sm text-chalk/85 leading-relaxed">{r.stratobot}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-lg border border-caution bg-caution-bg/20">
          <p className="text-xs text-chalk/80 leading-relaxed">
            Programmer costs and timelines above are general ranges drawn from public freelance
            marketplaces (e.g. Upwork, MQL5.com) — actual quotes vary by developer and complexity.
            Neither route guarantees a profitable strategy; StratoBot&apos;s free logic check only
            confirms your rules fire as described.
          </p>
        </div>

        <p className="text-sm text-chalk/70 text-center">
          Weighing whether to hire someone directly?{" "}
          <Link href="/compare/mql5-programmer" className="text-secondary hover:underline">
            See what that actually involves
          </Link>
        </p>

        <CtaBanner />
      </main>
    </div>
  );
}
