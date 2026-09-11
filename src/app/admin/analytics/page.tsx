"use client";

import { Header } from "@/components/Header";
import { useAdminGuard } from "@/lib/useAdminGuard";
import { useStrategyStore } from "@/lib/store";
import { BLOCKS, CATEGORIES } from "@/lib/blocks";

// Honest scope: with no backend there's no cross-user analytics to
// aggregate. Showing a fake "1,204 active users" chart would be exactly the
// kind of fabricated number the app's own honesty principle exists to rule
// out on the trader-facing side — the same rule applies here. This shows
// two things that are actually real: this device's current session state
// (from the same store the app itself uses), and static facts about the
// block library.

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-outline bg-slate px-4 py-3">
      <p className="text-[10px] font-mono font-bold tracking-wider uppercase text-chalk/50">
        {label}
      </p>
      <p className="text-lg font-bold text-chalk mono-num">{value}</p>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const { checked, allowed } = useAdminGuard();
  const { strategy, simsRemaining, paid } = useStrategyStore();

  if (!checked || !allowed) return null;

  return (
    <div className="flex flex-col flex-1">
      <Header back title="Analytics" />
      <main className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-6">
        <div className="p-3 rounded-lg border border-caution bg-caution-bg/20">
          <p className="text-xs text-chalk/80 leading-relaxed">
            There&apos;s no backend, so there&apos;s no real usage data across users to
            aggregate. This shows this device&apos;s actual current session state — not a
            fabricated dashboard.
          </p>
        </div>

        <div>
          <h2 className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-2">
            This device&apos;s session
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Simulations left" value={simsRemaining} />
            <StatTile label="Unlocked" value={paid ? "Yes" : "No"} />
            <StatTile label="Current strategy" value={strategy?.name ?? "None"} />
            <StatTile label="Blocks in it" value={strategy?.blocks.length ?? 0} />
          </div>
        </div>

        <div>
          <h2 className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-2">
            Block library (static)
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Total blocks" value={BLOCKS.length} />
            <StatTile label="Categories" value={CATEGORIES.length} />
          </div>
        </div>
      </main>
    </div>
  );
}
