import Link from "next/link";
import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "MQL5 EA Generator — Real, Compilable Code",
  description: "What's actually inside the MQL5 file StratoBot generates — deterministic templates, not freeform AI-written code.",
  path: "/mql5-ea-generator",
});

const CODE_FACTS = [
  {
    title: "CTrade-based order execution",
    body: "Entries and exits go through MQL5's standard CTrade class, the same approach used in hand-written EAs, not a custom order-sending hack.",
  },
  {
    title: "Real OnTick / OnInit structure",
    body: "Standard MQL5 event handlers — the file compiles and runs the way any MetaEditor-built EA does.",
  },
  {
    title: "Indicator handles, not recalculated values",
    body: "Technical conditions use proper indicator handles and CopyBuffer calls, matching current MQL5 conventions rather than deprecated MQL4-style direct calls.",
  },
  {
    title: "Configurable inputs",
    body: "Risk, lot size, and rule parameters are exposed as EA inputs you can see and adjust in MetaTrader, not buried as magic numbers.",
  },
];

export default function Mql5EaGeneratorPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="MQL5 EA generator" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">
            What&apos;s actually in the generated file
          </h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            StratoBot doesn&apos;t ask an AI to write MQL5 from scratch. It assembles your
            strategy from a fixed library of hand-written, pre-tested templates — so the output
            is predictable every time.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {CODE_FACTS.map((f) => (
            <div key={f.title} className="rounded-lg border border-outline bg-slate px-4 py-3.5">
              <p className="text-sm font-semibold text-chalk mb-1.5">{f.title}</p>
              <p className="text-xs text-chalk/70 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>

        <div>
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-2">
            Why deterministic beats freeform AI code
          </p>
          <p className="text-sm text-chalk/70 leading-relaxed">
            Freeform AI code generation can hallucinate logic that looks correct but isn&apos;t —
            a real risk when the code places real trades. A fixed block library structurally
            can&apos;t do that: every block has been written and reviewed once, then reused
            exactly, not reinvented per request.
          </p>
        </div>

        <p className="text-sm text-chalk/70 text-center">
          <Link href="/features" className="text-secondary hover:underline">See all features</Link>
          {" "}·{" "}
          <Link href="/convert-strategy-to-ea" className="text-secondary hover:underline">
            Convert your strategy now
          </Link>
        </p>

        <CtaBanner />
      </main>
    </div>
  );
}
