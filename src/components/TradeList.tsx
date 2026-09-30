import type { SimulatedTrade } from "@/lib/types";

// Per-trade explanations for rule strategies: why each trade opened (the
// rules that held, with the values the bot saw) and how it closed.

const OUTCOME_LABEL: Record<SimulatedTrade["outcome"], string> = {
  target: "Target hit",
  stopped: "Stopped out",
  closed: "Closed by rule",
  open: "Still open",
};

export function TradeList({ trades }: { trades: SimulatedTrade[] }) {
  const explained = trades.filter((t) => t.why?.length);
  if (!explained.length) return null;
  return (
    <div>
      <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-2">Why each trade happened</p>
      <div className="flex flex-col gap-2">
        {explained.map((t) => (
          <details key={t.index} className="rounded-lg border border-outline bg-slate px-3 py-2.5 group">
            <summary className="flex items-center justify-between gap-2 cursor-pointer list-none text-sm">
              <span className="flex items-center gap-2">
                <span className={`font-semibold ${t.direction === "buy" ? "text-buy" : "text-sell"}`}>
                  {t.direction === "buy" ? "Buy" : "Sell"}
                </span>
                <span className="text-chalk/60 mono-num">candle {t.candle + 1}</span>
              </span>
              <span className="flex items-center gap-1 text-chalk/70">
                {OUTCOME_LABEL[t.outcome]}
                <span className="material-symbols-outlined text-base transition-transform group-open:rotate-180">expand_more</span>
              </span>
            </summary>
            <ul className="mt-2 flex flex-col gap-1.5">
              {t.why!.map((line, i) => (
                <li key={i} className="text-xs text-chalk/80 leading-relaxed flex gap-1.5">
                  <span className="material-symbols-outlined text-sm text-buy leading-4">check</span>
                  <span>{line}</span>
                </li>
              ))}
              {t.exitWhy && (
                <li className="text-xs text-chalk/80 leading-relaxed flex gap-1.5">
                  <span className="material-symbols-outlined text-sm text-chalk/50 leading-4">logout</span>
                  <span>{t.exitWhy}</span>
                </li>
              )}
            </ul>
          </details>
        ))}
      </div>
    </div>
  );
}
