import type { ReactNode } from "react";

export function CalcResult({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-outline bg-slate px-4 py-3">
      <span className="text-sm text-chalk/70">{label}</span>
      <span
        className={`font-semibold mono-num ${
          emphasis ? "text-signal text-base" : "text-chalk text-sm"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function CalcResultGroup({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-2">{children}</div>;
}
