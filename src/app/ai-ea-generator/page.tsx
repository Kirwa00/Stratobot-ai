import Link from "next/link";
import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";

export const metadata = {
  title: "AI EA Generator — What That Actually Means",
  description: "Looking for an AI EA generator? Here's what StratoBot's AI actually does — and why we call it a strategy-to-EA platform, not an AI bot.",
};

export default function AiEaGeneratorPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="AI EA generator" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">
            Searching for an &ldquo;AI EA generator&rdquo;?
          </h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            Here&apos;s exactly what StratoBot&apos;s AI does — and doesn&apos;t do — so you know
            what you&apos;re actually getting.
          </p>
        </div>

        <div className="rounded-lg border border-outline bg-slate px-4 py-3.5">
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-buy mb-2">
            What the AI actually does
          </p>
          <p className="text-sm text-chalk/85 leading-relaxed">
            It reads your plain-language description and maps each rule to one of a fixed set of
            pre-written, hand-tested code blocks — an entry condition here, a stop-loss rule
            there. That&apos;s it. The mapping is the only thing the AI decides.
          </p>
        </div>

        <div className="rounded-lg border border-caution bg-caution-bg/20 px-4 py-3.5">
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-caution mb-2">
            What it doesn&apos;t do
          </p>
          <p className="text-sm text-chalk/80 leading-relaxed">
            It never writes freeform MQL5 code from scratch. Freeform AI-generated trading code
            can look plausible and still be wrong in ways that are hard to catch before it&apos;s
            live with real money — a risk we&apos;d rather not hand you.
          </p>
        </div>

        <div>
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-2">
            Why we don&apos;t call this an &ldquo;AI trading bot&rdquo;
          </p>
          <p className="text-sm text-chalk/70 leading-relaxed">
            An AI trading bot implies the AI is trading, or deciding what&apos;s profitable.
            StratoBot doesn&apos;t do either. It&apos;s a strategy-to-EA automation platform —
            your rules, built into real code. AI is the mechanism that gets you there faster; it
            isn&apos;t the product.
          </p>
        </div>

        <p className="text-sm text-chalk/70 text-center">
          Curious what the generated code actually looks like?{" "}
          <Link href="/mql5-ea-generator" className="text-secondary hover:underline">
            See the MQL5 generator page
          </Link>
        </p>

        <CtaBanner />
      </main>
    </div>
  );
}
