import Link from "next/link";
import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";
import { PropFirmCalculator } from "@/components/calculators/PropFirmCalculator";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Prop Firm Calculator — StratoBot AI",
  description: "Turn a prop firm challenge's percentage rules — profit target, daily loss limit, max drawdown — into real dollar figures.",
  path: "/tools/prop-firm-calculator",
});

export default function PropFirmCalculatorPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="Prop firm rules" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">
            Prop firm calculator
          </h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            Prop firm challenges are described in percentages. Here&apos;s what they mean in
            actual dollars for your account size.
          </p>
        </div>

        <PropFirmCalculator />

        <p className="text-sm text-chalk/70 text-center">
          <Link href="/tools" className="text-secondary hover:underline">All calculators</Link>
          {" "}·{" "}
          <Link href="/tools/drawdown-calculator" className="text-secondary hover:underline">
            Check a drawdown against these limits
          </Link>
        </p>

        <CtaBanner />
      </main>
    </div>
  );
}
