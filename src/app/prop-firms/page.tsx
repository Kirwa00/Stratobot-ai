import Link from "next/link";
import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";
import { PROP_FIRM_PARTNERS } from "@/lib/affiliates";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Prop Firm Comparison — StratoBot AI",
  description: "A starting list of well-known forex prop firms, so you know what to check before paying for a challenge.",
  path: "/prop-firms",
});

export default function PropFirmsPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="Prop firms" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-5">
        <div>
          <h1 className="font-display font-bold text-xl text-chalk mb-2">
            Getting funded to trade an EA
          </h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            A prop firm funds a trading account once you pass its evaluation, in exchange for a
            share of the profits. Run your challenge&apos;s numbers through the{" "}
            <Link href="/tools/prop-firm-calculator" className="text-secondary hover:underline">
              prop firm calculator
            </Link>{" "}
            and{" "}
            <Link
              href="/tools/prop-firm-consistency-calculator"
              className="text-secondary hover:underline"
            >
              consistency calculator
            </Link>{" "}
            before you commit to one.
          </p>
        </div>

        <div className="p-3 rounded-lg border border-caution bg-caution-bg/20">
          <p className="text-xs text-chalk/80 leading-relaxed">
            Challenge fees, profit splits, and rules vary by firm and change often — and this
            industry has seen firms shut down with little warning. Check a firm&apos;s current
            terms and recent trader reviews directly before paying for any challenge.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {PROP_FIRM_PARTNERS.map((f) => (
            <div
              key={f.id}
              className="rounded-lg border border-outline bg-slate px-4 py-3.5 flex flex-col gap-2"
            >
              <p className="text-sm font-semibold text-chalk">{f.name}</p>
              <p className="text-xs text-chalk/60 leading-relaxed">{f.note}</p>
              <a
                href={f.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-secondary hover:underline mt-1"
              >
                Visit {f.name} →
              </a>
            </div>
          ))}
        </div>

        <CtaBanner />
      </main>
    </div>
  );
}
