const STYLES: Record<string, { label: string; cls: string }> = {
  success: { label: "Paid", cls: "bg-buy/15 text-buy" },
  queued: { label: "Waiting", cls: "bg-caution/15 text-caution" },
  pending: { label: "Starting", cls: "bg-caution/15 text-caution" },
  failed: { label: "Failed", cls: "bg-sell/15 text-sell" },
};

export function StatusPill({ status }: { status: string }) {
  const s = STYLES[status] ?? { label: status, cls: "bg-slate-high text-chalk/70" };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>{s.label}</span>;
}
