import { randomBytes } from "node:crypto";
import { DESKTOP_MAX_PCS } from "../constants";
import { getDb, type Db } from "./db";
import type { PaymentRow } from "./payments";

// Desktop app licences. A paid "desktop" payment issues one key; the app
// activates it with a hashed machine id, and each key works on up to
// DESKTOP_MAX_PCS machines. Re-activating a machine that already holds the key
// is a no-op, so the app can re-check on every launch.

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const LICENSE_KEY_RE = /^SBD(-[A-HJ-NP-Z2-9]{4}){4}$/;

export function newLicenseKey(): string {
  const bytes = randomBytes(16);
  const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `SBD-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}-${chars.slice(12, 16)}`;
}

export function normalizeLicenseKey(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const k = input.trim().toUpperCase().replace(/\s+/g, "");
  return LICENSE_KEY_RE.test(k) ? k : null;
}

/** Idempotent: one key per successful desktop payment. */
export async function issueLicense(db: Db, payment: Pick<PaymentRow, "id" | "client_id" | "phone">): Promise<string> {
  const [existing] = await db.query<{ key: string }>(`select key from licenses where payment_id = $1`, [payment.id]);
  if (existing) return existing.key;
  const [row] = await db.query<{ key: string }>(
    `insert into licenses (key, payment_id, client_id, phone) values ($1, $2, $3, $4)
     on conflict (payment_id) do update set payment_id = excluded.payment_id returning key`,
    [newLicenseKey(), payment.id, payment.client_id, payment.phone]
  );
  return row.key;
}

export async function licenseForPayment(db: Db, paymentId: string): Promise<string | null> {
  const [row] = await db.query<{ key: string }>(`select key from licenses where payment_id = $1`, [paymentId]);
  return row?.key ?? null;
}

export type ActivateResult = { ok: true; machines: number; maxMachines: number } | { ok: false; error: string; status: number };

export async function activateLicense(
  input: { key: unknown; machineId: unknown },
  deps: { db?: Db | null } = {}
): Promise<ActivateResult> {
  const key = normalizeLicenseKey(input.key);
  if (!key) return { ok: false, error: "That doesn't look like a StratoBot licence key (SBD-XXXX-XXXX-XXXX-XXXX).", status: 400 };
  const machineId = typeof input.machineId === "string" && /^[a-f0-9]{64}$/.test(input.machineId) ? input.machineId : null;
  if (!machineId) return { ok: false, error: "Missing machine id.", status: 400 };
  const db = deps.db === undefined ? await getDb() : deps.db;
  if (!db) return { ok: false, error: "Licensing is offline. Try again shortly.", status: 503 };

  const [row] = await db.query<{ machines: string[]; revoked: boolean }>(
    `update licenses
        set machines = case when machines ? $2 then machines else machines || to_jsonb($2::text) end
      where key = $1 and not revoked and (machines ? $2 or jsonb_array_length(machines) < $3)
      returning machines, revoked`,
    [key, machineId, DESKTOP_MAX_PCS]
  );
  if (row) return { ok: true, machines: row.machines.length, maxMachines: DESKTOP_MAX_PCS };

  const [lic] = await db.query<{ revoked: boolean }>(`select revoked from licenses where key = $1`, [key]);
  if (!lic) return { ok: false, error: "We couldn't find that licence key. Check it and try again.", status: 404 };
  if (lic.revoked) return { ok: false, error: "This licence key has been switched off. Contact support.", status: 403 };
  return {
    ok: false,
    error: `This key is already active on ${DESKTOP_MAX_PCS} PCs. Contact support to move it to this one.`,
    status: 409,
  };
}
