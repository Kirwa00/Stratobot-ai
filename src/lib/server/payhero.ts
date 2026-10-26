import { SITE_URL } from "../seo";

// PayHero (now FinoQ) M-Pesa collections: STK push to the customer's phone,
// a callback when they answer, and a status lookup. Docs: docs.payhero.co.ke.
// All credentials come from environment variables set in Vercel; nothing here
// is ever sent to the browser.
//
//   PAYHERO_BASIC_AUTH      The "Basic Authorization" token from PayHero → API Keys
//   PAYHERO_CHANNEL_ID      The payment channel that receives the money (Payment Channels)
//   PAYHERO_CALLBACK_SECRET Any long random string; it guards the callback URL
//   PAYHERO_API_BASE        Optional, defaults to https://backend.payhero.co.ke

export interface PayHeroConfig {
  base: string;
  token: string | null;
  channelId: number | null;
  callbackSecret: string | null;
}

export function payheroConfig(): PayHeroConfig {
  const raw = process.env.PAYHERO_BASIC_AUTH?.trim() || null;
  const channel = Number(process.env.PAYHERO_CHANNEL_ID);
  return {
    base: (process.env.PAYHERO_API_BASE || "https://backend.payhero.co.ke").replace(/\/$/, ""),
    token: raw ? raw.replace(/^Basic\s+/i, "") : null,
    channelId: Number.isInteger(channel) && channel > 0 ? channel : null,
    callbackSecret: process.env.PAYHERO_CALLBACK_SECRET?.trim() || null,
  };
}

/** Everything needed to take a payment is present. */
export function payheroReady(c = payheroConfig()): boolean {
  return Boolean(c.token && c.channelId && c.callbackSecret);
}

export function callbackUrl(c = payheroConfig()): string | null {
  if (!c.callbackSecret) return null;
  const base = process.env.PAYHERO_CALLBACK_BASE || SITE_URL;
  return `${base.replace(/\/$/, "")}/api/pay/callback?secret=${encodeURIComponent(c.callbackSecret)}`;
}

export class PayHeroError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
  }
}

async function call<T>(c: PayHeroConfig, path: string, init: RequestInit = {}): Promise<T> {
  if (!c.token) throw new PayHeroError("PayHero isn't configured (PAYHERO_BASIC_AUTH is missing).");
  const res = await fetch(`${c.base}${path}`, {
    ...init,
    headers: { Authorization: `Basic ${c.token}`, "Content-Type": "application/json", ...init.headers },
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // non-JSON error page
  }
  if (!res.ok) {
    const msg =
      (body as { error_message?: string; message?: string; detail?: string } | null)?.error_message ??
      (body as { message?: string } | null)?.message ??
      (body as { detail?: string } | null)?.detail ??
      `HTTP ${res.status}`;
    throw new PayHeroError(`PayHero: ${msg}`, res.status);
  }
  return body as T;
}

export interface StkPushResult {
  success: boolean;
  status: string;
  reference: string;
  CheckoutRequestID?: string;
}

/** Send the M-Pesa prompt to the customer's phone. */
export function stkPush(
  c: PayHeroConfig,
  p: { amount: number; phone: string; reference: string; customerName?: string }
): Promise<StkPushResult> {
  return call<StkPushResult>(c, "/api/v2/payments", {
    method: "POST",
    body: JSON.stringify({
      amount: p.amount,
      phone_number: p.phone,
      channel_id: c.channelId,
      provider: "m-pesa",
      external_reference: p.reference,
      customer_name: p.customerName,
      callback_url: callbackUrl(c),
    }),
  });
}

export interface TransactionStatus {
  status: "QUEUED" | "SUCCESS" | "FAILED" | string;
  success?: boolean;
  reference?: string;
  provider_reference?: string;
  third_party_reference?: string;
  transaction_date?: string;
}

/** The authoritative state of a payment (callbacks are only a hint to look this up). */
export function transactionStatus(c: PayHeroConfig, reference: string): Promise<TransactionStatus> {
  return call<TransactionStatus>(c, `/api/v2/transaction-status?reference=${encodeURIComponent(reference)}`);
}

export interface PaymentChannel {
  id: number;
  channel_type: string;
  short_code?: string;
  account_number?: string;
  description?: string;
  is_active: boolean;
}

export async function paymentChannels(c: PayHeroConfig): Promise<PaymentChannel[]> {
  const r = await call<{ payment_channels?: PaymentChannel[] }>(c, "/api/v2/payment_channels");
  return r.payment_channels ?? [];
}

/** 0712345678, 712345678, +254712345678, 254 712 345 678 → 254712345678 (Safaricom/Airtel mobile), else null. */
export function normalizeKenyanPhone(input: string): string | null {
  const d = input.replace(/[\s\-().]/g, "").replace(/^\+/, "");
  const m = d.match(/^(?:254|0)?([17]\d{8})$/);
  return m ? `254${m[1]}` : null;
}

/** For display: 254712345678 → 0712 ***678. */
export function maskPhone(phone: string): string {
  const local = phone.replace(/^254/, "0");
  return `${local.slice(0, 4)} ***${local.slice(-3)}`;
}
