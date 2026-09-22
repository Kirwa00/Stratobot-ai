import { Header } from "@/components/Header";
import { VPS_PROVIDERS } from "@/lib/affiliates";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Forex VPS Comparison — StratoBot AI",
  description: "Compare forex-specialized and general-purpose VPS providers so your MT5 Expert Advisor keeps trading after you close your laptop.",
  path: "/vps",
});

export default function VpsComparisonPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="Compare VPS" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-5">
        <div>
          <h1 className="font-display font-bold text-xl text-chalk mb-2">
            Keep your bot running when your computer isn&apos;t
          </h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            Your EA only trades while MetaTrader 5 is open. A VPS is just a remote computer that
            stays on 24/7 so your terminal — and your bot — keeps running after you close your
            laptop. Forex-specialized providers sit closer to broker servers for lower latency;
            general-purpose providers are cheaper but you set MT5 up yourself.
          </p>
        </div>

        <div className="p-3 rounded-lg border border-caution bg-caution-bg/20">
          <p className="text-xs text-chalk/80 leading-relaxed">
            Pricing and specs below are pulled from each provider&apos;s own site and change over
            time — treat this as a starting point, not a live price feed, and check current
            details before buying.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {VPS_PROVIDERS.map((p) => (
            <div key={p.id} className="rounded-lg border border-outline bg-slate px-4 py-3.5 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-chalk">{p.name}</p>
                <span
                  className={`shrink-0 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    p.focus === "Forex-specialized"
                      ? "border-signal/40 text-signal"
                      : "border-outline text-chalk/50"
                  }`}
                >
                  {p.focus}
                </span>
              </div>
              <p className="text-sm font-medium text-chalk mono-num">{p.fromPrice}</p>
              <p className="text-xs text-chalk/60 leading-relaxed">{p.note}</p>
              <a
                href={p.href}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="text-sm font-semibold text-secondary hover:underline mt-1"
              >
                Visit {p.name} →
              </a>
              <p className="text-[10px] text-chalk/40 leading-relaxed">
                Affiliate link — we may earn a commission at no extra cost to you.
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
