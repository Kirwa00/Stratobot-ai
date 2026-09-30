import { describeRules } from "@/lib/rules/describe";
import type { RuleStrategy } from "@/lib/rules/types";

// Plain-English readback of a rule strategy, generated deterministically from
// the exact rules the bot is compiled from (lib/rules/describe.ts).

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-1.5">{title}</p>
      <ul className="flex flex-col gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-[15px] leading-relaxed text-chalk/90 flex gap-2">
            <span className="text-chalk/40 select-none">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RulesReadback({ rules }: { rules: RuleStrategy }) {
  const r = describeRules(rules);
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-chalk/70 leading-relaxed">{r.timeframe}</p>
      <Section title="Only when" items={r.filters} />
      {r.direction ? (
        <Section title="Direction" items={[r.direction]} />
      ) : (
        <>
          {r.long ? <Section title="Buy when" items={r.long} /> : <p className="text-sm text-chalk/70">Never buys.</p>}
          {r.short ? <Section title="Sell when" items={r.short} /> : <p className="text-sm text-chalk/70">Never sells.</p>}
        </>
      )}
      <Section title="Entry" items={r.entry} />
      <Section title="Exits" items={r.exits} />
      <Section title="Size" items={r.sizing} />
      <Section title="Limits" items={r.guards} />
    </div>
  );
}
