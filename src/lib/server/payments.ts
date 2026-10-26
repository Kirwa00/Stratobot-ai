import { randomBytes } from "node:crypto";
import { PRICE_PER_EA_KES, PRO_MONTHLY_KES } from "../constants";
import { getDb, type Db } from "./db";
import {
  normalizeKenyanPhone,
  payheroConfig,
  payheroReady,
  PayHeroError,
  stkPush,
  transactionStatus,
  type PayHeroConfig,
} from "./payhero";

// Payment lifecycle: pending (row written) → queued (PayHero accepted the STK
// push) → success | failed. Only PayHero's transaction-status lookup moves a
// payment to success; the callback just triggers that lookup, so a forged or
// replayed callback can't unlock anything.

export type PaymentKind = "ea" | "pro";
export type PaymentStatus = "pending" | "queued" | "success" | "failed";

export interface PaymentRow {
  id: string;
  created_at: string;
  updated_at: string;
  kind: PaymentKind;
  amount: number;
  phone: string;
  client_id: string;
  strategy_id: string | null;
  strategy_name: string | null;
  status: PaymentStatus;
  provider_ref: string | null;
  checkout_request_id: string | null;
  receipt: string | null;
  result_desc: string | null;
}

export const PRICES: Record<PaymentKind, number> = { ea: PRICE_PER_EA_KES, pro: PRO_MONTHLY_KES };

/** Stop well short of PayHero's block (10 failed prompts to one number → 24h block). */
const MAX_FAILED_PER_PHONE_PER_HOUR = 4;

export type StartResult = { ok: true; id: string } | { ok: false; error: string; status: number };

export async function startPayment(
  input: { kind: unknown; phone: unknown; clientId: unknown; strategyId?: unknown; strategyName?: unknown },
  deps: { db?: Db | null; config?: PayHeroConfig } = {}
): Promise<StartResult> {
  const config = deps.config ?? payheroConfig();
  if (!payheroReady(config)) return { ok: false, error: "Payments aren't switched on yet.", status: 503 };
  const db = deps.db === undefined ? await getDb() : deps.db;
  if (!db) return { ok: false, error: "Payments need the database, which isn't connected.", status: 503 };

  const kind = input.kind === "pro" ? "pro" : input.kind === "ea" ? "ea" : null;
  if (!kind) return { ok: false, error: "Unknown purchase.", status: 400 };
  const phone = typeof input.phone === "string" ? normalizeKenyanPhone(input.phone) : null;
  if (!phone) return { ok: false, error: "Enter a Safaricom or Airtel number, like 0712 345 678.", status: 400 };
  const clientId = typeof input.clientId === "string" && /^[\w-]{8,64}$/.test(input.clientId) ? input.clientId : null;
  if (!clientId) return { ok: false, error: "Missing browser id.", status: 400 };
  const strategyId = typeof input.strategyId === "string" ? input.strategyId.slice(0, 80) : null;
  if (kind === "ea" && !strategyId) return { ok: false, error: "Missing strategy.", status: 400 };
  const strategyName = typeof input.strategyName === "string" ? input.strategyName.slice(0, 120) : null;

  const [recent] = await db.query<{ failed: string; open: string }>(
    `select count(*) filter (where status = 'failed' and created_at > now() - interval '1 hour') as failed,
            count(*) filter (where status in ('pending','queued') and created_at > now() - interval '2 minutes') as open
       from payments where phone = $1`,
    [phone]
  );
  if (Number(recent.open) > 0) return { ok: false, error: "A payment prompt was just sent to that number. Check your phone.", status: 429 };
  if (Number(recent.failed) >= MAX_FAILED_PER_PHONE_PER_HOUR)
    return { ok: false, error: "Too many unfinished payments on that number. Try again in an hour.", status: 429 };

  const id = `SB-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
  const amount = PRICES[kind];
  await db.query(
    `insert into payments (id, kind, amount, phone, client_id, strategy_id, strategy_name, status)
     values ($1, $2, $3, $4, $5, $6, $7, 'pending')`,
    [id, kind, amount, phone, clientId, strategyId, strategyName]
  );

  try {
    const r = await stkPush(config, { amount, phone, reference: id });
    await db.query(
      `update payments set status = 'queued', provider_ref = $2, checkout_request_id = $3, updated_at = now() where id = $1`,
      [id, r.reference ?? null, r.CheckoutRequestID ?? null]
    );
    return { ok: true, id };
  } catch (err) {
    const msg = err instanceof PayHeroError ? err.message : "Couldn't reach PayHero.";
    await db.query(`update payments set status = 'failed', result_desc = $2, updated_at = now() where id = $1`, [id, msg]);
    return { ok: false, error: "Couldn't send the M-Pesa prompt. Check the number and try again.", status: 502 };
  }
}

/** Load a payment, asking PayHero for its real state while it's still open. */
export async function refreshPayment(id: string, deps: { db?: Db | null; config?: PayHeroConfig } = {}): Promise<PaymentRow | null> {
  const db = deps.db === undefined ? await getDb() : deps.db;
  if (!db) return null;
  const [row] = await db.query<PaymentRow>(`select * from payments where id = $1`, [id]);
  if (!row || row.status !== "queued" || !row.provider_ref) return row ?? null;

  const config = deps.config ?? payheroConfig();
  try {
    const s = await transactionStatus(config, row.provider_ref);
    const st = String(s.status).toUpperCase();
    if (st === "SUCCESS") {
      const receipt = s.provider_reference || s.third_party_reference || null;
      const [updated] = await db.query<PaymentRow>(
        `update payments set status = 'success', receipt = $2, result_desc = 'Paid', updated_at = now()
          where id = $1 and status = 'queued' returning *`,
        [id, receipt]
      );
      if (updated) {
        await db.query(`insert into events (type, client_id, data) values ('payment_succeeded', $1, $2)`, [
          row.client_id,
          JSON.stringify({ kind: row.kind, amount: row.amount }),
        ]);
        return updated;
      }
    } else if (st === "FAILED") {
      const [updated] = await db.query<PaymentRow>(
        `update payments set status = 'failed', result_desc = 'Cancelled or failed on the phone', updated_at = now()
          where id = $1 and status = 'queued' returning *`,
        [id]
      );
      if (updated) return updated;
    }
  } catch {
    // PayHero unreachable: leave it queued and try again on the next poll.
  }
  const [latest] = await db.query<PaymentRow>(`select * from payments where id = $1`, [id]);
  return latest ?? null;
}

/** PayHero's callback: find our payment by its reference, then verify through the API. */
export async function handleCallback(body: unknown, deps: { db?: Db | null; config?: PayHeroConfig } = {}): Promise<boolean> {
  const response = (body as { response?: Record<string, unknown> } | null)?.response;
  const ref = typeof response?.ExternalReference === "string" ? response.ExternalReference : null;
  if (!ref || !/^SB-[A-Z0-9]+-[A-F0-9]{6}$/.test(ref)) return false;
  const row = await refreshPayment(ref, deps);
  return row !== null;
}

/** What the browser is told about its payment: no phone number or provider details. */
export function publicStatus(row: PaymentRow) {
  return { id: row.id, status: row.status, kind: row.kind, strategyId: row.strategy_id, amount: row.amount };
}
