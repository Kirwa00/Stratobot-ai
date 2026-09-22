import Link from "next/link";
import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Choosing an EA Generator — Questions to Ask First",
  description: "What to check before trusting any EA generator with your trading strategy, and where StratoBot fits.",
  path: "/compare/ea-generator",
});

const QUESTIONS = [
  {
    title: "Does it write freeform code, or assemble from tested templates?",
    body: "Freeform AI code generation can produce logic that looks right and isn't — a real risk once it's placing trades. Ask whether the output comes from reviewed, reused building blocks or is generated fresh every time.",
  },
  {
    title: "Do you get the actual source file?",
    body: "Some tools keep the generated code locked to their platform. You should be able to open, read, and compile the .mq5 file yourself in MetaEditor.",
  },
  {
    title: "Does it claim to predict profitability?",
    body: "Be skeptical of any tool that implies its output — or its \"backtest\" — proves a strategy will make money. A logic check confirms rules fire correctly; it isn't a performance guarantee, and no honest tool will claim otherwise.",
  },
  {
    title: "Can you see what it understood before committing?",
    body: "A read-back of your strategy, shown before you pay, is the difference between catching a misunderstanding early and finding out after you've downloaded the wrong logic.",
  },
  {
    title: "What happens when you want to change a rule later?",
    body: "Some services charge per generation or per revision. Check whether iterating on a strategy costs you again each time.",
  },
];

export default function EaGeneratorComparePage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="Choosing a generator" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">
            Choosing an EA generator: what to actually check
          </h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            We won&apos;t claim to have benchmarked every EA generator out there — that&apos;s not
            something we can honestly verify. Instead, here are the questions worth asking any of
            them, StratoBot included.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {QUESTIONS.map((q, i) => (
            <div key={q.title} className="rounded-lg border border-outline bg-slate px-4 py-3.5 flex gap-3">
              <span className="font-mono text-xs text-chalk/40 mt-0.5 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="text-sm font-semibold text-chalk mb-1">{q.title}</p>
                <p className="text-xs text-chalk/70 leading-relaxed">{q.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-signal/40 bg-slate px-4 py-3.5">
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-signal mb-1.5">
            Where StratoBot lands on these
          </p>
          <p className="text-sm text-chalk/85 leading-relaxed">
            Deterministic block templates, not freeform code. A real .mq5 file you can open
            yourself. A free logic check that&apos;s explicit about what it isn&apos;t. A
            read-back before you pay. Unlimited regeneration while your pass is active.
          </p>
        </div>

        <p className="text-sm text-chalk/70 text-center">
          <Link href="/mql5-ea-generator" className="text-secondary hover:underline">
            What&apos;s actually in the generated code
          </Link>{" "}
          · <Link href="/ai-ea-generator" className="text-secondary hover:underline">
            What the AI does and doesn&apos;t do
          </Link>
        </p>

        <CtaBanner />
      </main>
    </div>
  );
}
