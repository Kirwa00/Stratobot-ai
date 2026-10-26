import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySession } from "./admin-auth";
import type { Db } from "./db";
import type { PaymentRow, PaymentStatus } from "./payments";

/** For admin route handlers and pages (the proxy already gates them; this is the second check). */
export async function isAdmin(): Promise<boolean> {
  return verifySession((await cookies()).get(ADMIN_COOKIE)?.value);
}

export interface DashboardStats {
  revenue: { all: number; d30: number; d7: number };
  payments: Record<PaymentStatus, number>;
  paidByKind: { ea: number; pro: number };
  events: { type: string; d1: number; d7: number; d30: number }[];
  realCandleChecks30: number;
  clients30: number;
}

export async function dashboardStats(db: Db): Promise<DashboardStats> {
  const [rev] = await db.query<{ all: string | null; d30: string | null; d7: string | null }>(
    `select sum(amount) filter (where status = 'success') as all,
            sum(amount) filter (where status = 'success' and created_at > now() - interval '30 days') as d30,
            sum(amount) filter (where status = 'success' and created_at > now() - interval '7 days') as d7
       from payments`
  );
  const byStatus = await db.query<{ status: PaymentStatus; n: string }>(`select status, count(*) as n from payments group by status`);
  const byKind = await db.query<{ kind: "ea" | "pro"; n: string }>(
    `select kind, count(*) as n from payments where status = 'success' group by kind`
  );
  const events = await db.query<{ type: string; d1: string; d7: string; d30: string }>(
    `select type,
            count(*) filter (where at > now() - interval '1 day') as d1,
            count(*) filter (where at > now() - interval '7 days') as d7,
            count(*) as d30
       from events where at > now() - interval '30 days'
      group by type order by d30 desc`
  );
  const [real] = await db.query<{ n: string }>(
    `select count(*) as n from events where type = 'logic_check_run' and data->>'data' = 'real' and at > now() - interval '30 days'`
  );
  const [clients] = await db.query<{ n: string }>(
    `select count(distinct client_id) as n from events where at > now() - interval '30 days'`
  );
  const payments: Record<PaymentStatus, number> = { pending: 0, queued: 0, success: 0, failed: 0 };
  for (const r of byStatus) payments[r.status] = Number(r.n);
  const paidByKind = { ea: 0, pro: 0 };
  for (const r of byKind) paidByKind[r.kind] = Number(r.n);
  return {
    revenue: { all: Number(rev?.all ?? 0), d30: Number(rev?.d30 ?? 0), d7: Number(rev?.d7 ?? 0) },
    payments,
    paidByKind,
    events: events.map((e) => ({ type: e.type, d1: Number(e.d1), d7: Number(e.d7), d30: Number(e.d30) })),
    realCandleChecks30: Number(real?.n ?? 0),
    clients30: Number(clients?.n ?? 0),
  };
}

export async function listPayments(db: Db, opts: { status?: string; limit?: number } = {}): Promise<PaymentRow[]> {
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 500);
  if (opts.status && ["pending", "queued", "success", "failed"].includes(opts.status)) {
    return db.query<PaymentRow>(`select * from payments where status = $1 order by created_at desc limit $2`, [opts.status, limit]);
  }
  return db.query<PaymentRow>(`select * from payments order by created_at desc limit $1`, [limit]);
}

export async function dailyRevenue(db: Db, days = 30): Promise<{ day: string; kes: number; count: number }[]> {
  const rows = await db.query<{ day: string; kes: string; n: string }>(
    `select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day, sum(amount) as kes, count(*) as n
       from payments where status = 'success' and created_at > now() - ($1 || ' days')::interval
      group by 1 order by 1`,
    [String(days)]
  );
  return rows.map((r) => ({ day: r.day, kes: Number(r.kes), count: Number(r.n) }));
}
