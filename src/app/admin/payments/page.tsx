import Link from "next/link";
import { getDb } from "@/lib/server/db";
import { listPayments } from "@/lib/server/admin-data";
import { StatusPill } from "../StatusPill";
import { RecheckButton } from "./RecheckButton";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "", label: "All" },
  { key: "success", label: "Paid" },
  { key: "queued", label: "Waiting" },
  { key: "failed", label: "Failed" },
];

const when = (s: string) =>
  new Date(s).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Nairobi",
  });

export default async function AdminPayments({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "" } = await searchParams;
  const db = await getDb().catch(() => null);
  if (!db) {
    return (
      <main className="flex-1 px-4 py-10">
        <p className="text-sm text-chalk/75">No database connected. See the dashboard for how to add one.</p>
      </main>
    );
  }
  const rows = await listPayments(db, { status, limit: 300 });

  return (
    <main className="flex-1 px-4 py-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="font-display text-2xl text-chalk mr-4">Payments</h1>
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key ? `/admin/payments?status=${f.key}` : "/admin/payments"}
            className={`rounded-full px-3 py-1 text-sm border ${status === f.key ? "border-signal text-chalk" : "border-outline text-chalk/60"}`}
          >
            {f.label}
          </Link>
        ))}
      </div>
      <p className="text-xs text-chalk/55">
        Phone numbers are shown in full here so you can support buyers and issue refunds. Times are Nairobi time.
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-chalk/60">No payments{status ? " with this status" : ""} yet.</p>
      ) : (
        <div className="rounded-lg border border-outline overflow-x-auto">
          <table className="w-full text-sm min-w-[860px]">
            <thead className="bg-slate text-chalk/60 text-xs">
              <tr>
                <th className="text-left px-3 py-2 font-medium">When</th>
                <th className="text-left px-3 py-2 font-medium">Status</th>
                <th className="text-right px-3 py-2 font-medium">KES</th>
                <th className="text-left px-3 py-2 font-medium">For</th>
                <th className="text-left px-3 py-2 font-medium">Phone</th>
                <th className="text-left px-3 py-2 font-medium">M-Pesa receipt</th>
                <th className="text-left px-3 py-2 font-medium">Our ref</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t border-outline align-top">
                  <td className="px-3 py-2 text-chalk/70 whitespace-nowrap">{when(p.created_at)}</td>
                  <td className="px-3 py-2">
                    <StatusPill status={p.status} />
                    {p.result_desc && p.status === "failed" && <p className="text-xs text-chalk/50 mt-1">{p.result_desc}</p>}
                  </td>
                  <td className="px-3 py-2 text-right mono-num">{p.amount.toLocaleString("en-KE")}</td>
                  <td className="px-3 py-2 text-chalk/85">{p.kind === "pro" ? "Pro, 30 days" : p.strategy_name || "One EA"}</td>
                  <td className="px-3 py-2 mono-num">{p.phone.replace(/^254/, "0")}</td>
                  <td className="px-3 py-2 mono-num">{p.receipt ?? "—"}</td>
                  <td className="px-3 py-2 mono-num text-xs text-chalk/60">{p.id}</td>
                  <td className="px-3 py-2">{p.status === "queued" && <RecheckButton id={p.id} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
