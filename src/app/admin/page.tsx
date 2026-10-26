import Link from "next/link";
import { databaseMode, getDb } from "@/lib/server/db";
import { dailyRevenue, dashboardStats, listPayments } from "@/lib/server/admin-data";
import { payheroReady } from "@/lib/server/payhero";
import { maskPhone } from "@/lib/server/payhero";
import { EVENT_LABELS } from "@/lib/events";
import { StatusPill } from "./StatusPill";

// Everything here is read from StratoBot's own database: payments as PayHero
// confirmed them, and first-party funnel events. No sample or placeholder data.
export const dynamic = "force-dynamic";

const kes = (n: number) => `KES ${n.toLocaleString("en-KE")}`;
const when = (s: string) =>
  new Date(s).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Nairobi" });

export default async function AdminDashboard() {
  const db = await getDb().catch((err) => {
    console.error("[admin] database unavailable", err);
    return null;
  });
  if (!db) return <NoDatabase />;
  const [stats, recent, daily] = await Promise.all([dashboardStats(db), listPayments(db, { limit: 8 }), dailyRevenue(db, 30)]);
  const maxDay = Math.max(1, ...daily.map((d) => d.kes));
  const payheroOn = payheroReady();

  return (
    <main className="flex-1 px-4 py-6 flex flex-col gap-8">
      {(!payheroOn || databaseMode() === "local") && (
        <div className="rounded-lg border border-caution/50 bg-slate px-4 py-3 text-sm text-chalk/85">
          {databaseMode() === "local" && <p>Local development database: data here is only on this computer.</p>}
          {!payheroOn && (
            <p>
              PayHero isn&apos;t fully configured, so buyers see &ldquo;checkout opening soon&rdquo;.{" "}
              <Link href="/admin/settings" className="text-secondary hover:underline">
                Settings
              </Link>
            </p>
          )}
        </div>
      )}

      <section aria-label="Revenue" className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tile label="Revenue, all time" value={kes(stats.revenue.all)} />
        <Tile label="Last 30 days" value={kes(stats.revenue.d30)} />
        <Tile label="Last 7 days" value={kes(stats.revenue.d7)} />
        <Tile label="Paid: EAs / Pro" value={`${stats.paidByKind.ea} / ${stats.paidByKind.pro}`} />
        <Tile label="Payments succeeded" value={String(stats.payments.success)} tone="buy" />
        <Tile label="Waiting on phone" value={String(stats.payments.queued + stats.payments.pending)} />
        <Tile label="Failed or cancelled" value={String(stats.payments.failed)} tone="sell" />
        <Tile label="Browsers, 30 days" value={String(stats.clients30)} />
      </section>

      <section aria-labelledby="daily">
        <h2 id="daily" className="font-display text-xl text-chalk mb-3">
          Revenue per day, last 30 days
        </h2>
        {daily.length === 0 ? (
          <p className="text-sm text-chalk/60">No paid orders yet.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {daily.map((d) => (
              <li key={d.day} className="grid grid-cols-[90px_1fr_130px] items-center gap-3 text-sm">
                <span className="mono-num text-chalk/60">{d.day.slice(5)}</span>
                <span className="h-3 rounded bg-signal/80" style={{ width: `${(d.kes / maxDay) * 100}%` }} aria-hidden="true" />
                <span className="mono-num text-chalk text-right">
                  {kes(d.kes)} · {d.count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="funnel">
        <h2 id="funnel" className="font-display text-xl text-chalk mb-3">
          Funnel
        </h2>
        {stats.events.length === 0 ? (
          <p className="text-sm text-chalk/60">No activity recorded yet.</p>
        ) : (
          <div className="rounded-lg border border-outline overflow-x-auto">
            <table className="w-full text-sm min-w-[420px]">
              <thead className="bg-slate text-chalk/60 text-xs">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Event</th>
                  <th className="text-right px-4 py-2 font-medium">24 h</th>
                  <th className="text-right px-4 py-2 font-medium">7 days</th>
                  <th className="text-right px-4 py-2 font-medium">30 days</th>
                </tr>
              </thead>
              <tbody>
                {stats.events.map((e) => (
                  <tr key={e.type} className="border-t border-outline">
                    <td className="px-4 py-2 text-chalk">{EVENT_LABELS[e.type] ?? e.type}</td>
                    <td className="px-4 py-2 text-right mono-num">{e.d1}</td>
                    <td className="px-4 py-2 text-right mono-num">{e.d7}</td>
                    <td className="px-4 py-2 text-right mono-num">{e.d30}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-chalk/50 mt-2">
          {stats.realCandleChecks30} logic checks in the last 30 days ran on traders&apos; own MT5 candles. Counts come from
          browsers that loaded the site, so ad blockers can hide some.
        </p>
      </section>

      <section aria-labelledby="recent">
        <div className="flex items-baseline justify-between mb-3">
          <h2 id="recent" className="font-display text-xl text-chalk">
            Latest payments
          </h2>
          <Link href="/admin/payments" className="text-sm text-secondary hover:underline">
            All payments
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-chalk/60">No payments yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recent.map((p) => (
              <li key={p.id} className="rounded-lg border border-outline bg-slate px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <StatusPill status={p.status} />
                <span className="mono-num text-chalk">{kes(p.amount)}</span>
                <span className="text-chalk/80">{p.kind === "pro" ? "Pro, 30 days" : p.strategy_name || "One EA"}</span>
                <span className="text-chalk/60 mono-num">{maskPhone(p.phone)}</span>
                <span className="text-chalk/50 ml-auto">{when(p.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: "buy" | "sell" }) {
  const color = tone === "buy" ? "text-buy" : tone === "sell" ? "text-sell" : "text-chalk";
  return (
    <div className="rounded-lg border border-outline bg-slate px-4 py-3">
      <p className="text-[11px] font-mono font-bold tracking-wider uppercase text-chalk/50">{label}</p>
      <p className={`text-xl font-bold mono-num ${color}`}>{value}</p>
    </div>
  );
}

function NoDatabase() {
  return (
    <main className="flex-1 px-4 py-10 max-w-2xl">
      <h1 className="font-display text-2xl text-chalk mb-3">No database connected</h1>
      <p className="text-sm text-chalk/75 leading-relaxed mb-3">
        Payments and site activity are stored in Postgres. In Vercel, open the StratoBot project → Storage → Create
        Database → Neon (the free plan is enough), connect it to Production and Preview, then redeploy. It adds{" "}
        <code className="font-mono text-xs">DATABASE_URL</code> automatically.
      </p>
      <Link href="/admin/settings" className="text-sm text-secondary hover:underline">
        See all settings
      </Link>
    </main>
  );
}
