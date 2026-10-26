import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

// Payments end to end against an in-memory Postgres and a fake PayHero:
// price set by the server, STK push, status polling, callback verification,
// and the guards against abuse and forged callbacks.

import { getDb, resetDbForTests } from "../server/db";
import { startPayment, refreshPayment, handleCallback, publicStatus } from "../server/payments";
import { normalizeKenyanPhone, maskPhone } from "../server/payhero";
import { createSession, verifySession } from "../server/admin-auth";

// Read lazily by getDb(), so setting it here (after the hoisted imports) is in time.
process.env.LOCAL_DB_DIR = "memory://";

const config = { base: "https://payhero.test", token: "dG9rZW4=", channelId: 133, callbackSecret: "s3cret" };

type Call = { url: string; body?: Record<string, unknown> };
let calls: Call[] = [];
let txStatus = "QUEUED";
let stkFails = false;

globalThis.fetch = (async (input: string | URL, init?: RequestInit) => {
  const url = String(input);
  calls.push({ url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
  if (url.endsWith("/api/v2/payments")) {
    if (stkFails) return new Response(JSON.stringify({ error_message: "invalid phone" }), { status: 400 });
    return new Response(JSON.stringify({ success: true, status: "QUEUED", reference: "PH-REF-1", CheckoutRequestID: "ws_CO_1" }), { status: 201 });
  }
  if (url.includes("/api/v2/transaction-status")) {
    return new Response(JSON.stringify({ status: txStatus, provider_reference: "SKQ96C7K7H" }), { status: 200 });
  }
  return new Response("not found", { status: 404 });
}) as typeof fetch;

beforeEach(() => {
  resetDbForTests();
  calls = [];
  txStatus = "QUEUED";
  stkFails = false;
});

const base = { kind: "ea", phone: "0712 345 678", clientId: "client-abc123", strategyId: "strat-1", strategyName: "EMA cross" };

test("Kenyan phone numbers are normalised and masked", () => {
  for (const p of ["0712345678", "712345678", "+254712345678", "254 712 345 678", "0112-345-678"]) {
    assert.match(normalizeKenyanPhone(p) ?? "", /^2547\d{8}$|^2541\d{8}$/, p);
  }
  for (const p of ["12345", "0812345678", "+44712345678", ""]) assert.equal(normalizeKenyanPhone(p), null, p);
  assert.equal(maskPhone("254712345678"), "0712 ***678");
});

test("a payment: server price, STK push, then success only after PayHero confirms", async () => {
  const db = await getDb();
  const r = await startPayment({ ...base, kind: "ea" }, { db, config });
  assert.ok(r.ok);
  const push = calls.find((c) => c.url.endsWith("/api/v2/payments"))!;
  assert.equal(push.body?.amount, 1000, "price comes from the server, not the browser");
  assert.equal(push.body?.phone_number, "254712345678");
  assert.equal(push.body?.channel_id, 133);
  assert.equal(push.body?.external_reference, r.ok ? r.id : "");

  const id = r.ok ? r.id : "";
  assert.equal((await refreshPayment(id, { db, config }))?.status, "queued");
  txStatus = "SUCCESS";
  const paid = (await refreshPayment(id, { db, config }))!;
  assert.equal(paid.status, "success");
  assert.equal(paid.receipt, "SKQ96C7K7H");
  assert.deepEqual(publicStatus(paid), { id, status: "success", kind: "ea", strategyId: "strat-1", amount: 1000 });
  const [ev] = await db!.query<{ n: string }>(`select count(*) as n from events where type = 'payment_succeeded'`);
  assert.equal(Number(ev.n), 1);
  // Settled payments don't flip back, and success is recorded once.
  txStatus = "FAILED";
  assert.equal((await refreshPayment(id, { db, config }))?.status, "success");
});

test("Pro is priced on the server too", async () => {
  const db = await getDb();
  const r = await startPayment({ ...base, kind: "pro", strategyId: undefined }, { db, config });
  assert.ok(r.ok);
  assert.equal(calls.find((c) => c.url.endsWith("/api/v2/payments"))?.body?.amount, 1500);
});

test("callbacks only trigger a status check; a forged 'Success' unlocks nothing", async () => {
  const db = await getDb();
  const r = await startPayment(base, { db, config });
  const id = r.ok ? r.id : "";
  const forged = { response: { ExternalReference: id, Status: "Success", ResultCode: 0 } };
  assert.equal(await handleCallback(forged, { db, config }), true);
  assert.equal((await refreshPayment(id, { db, config }))?.status, "queued", "PayHero still says QUEUED");
  txStatus = "FAILED";
  await handleCallback(forged, { db, config });
  assert.equal((await refreshPayment(id, { db, config }))?.status, "failed");
  assert.equal(await handleCallback({ response: { ExternalReference: "'; drop table payments; --" } }, { db, config }), false);
});

test("guards: bad input, double prompts, repeated failures, PayHero errors, not configured", async () => {
  const db = await getDb();
  assert.equal((await startPayment({ ...base, phone: "123" }, { db, config })).ok, false);
  assert.equal((await startPayment({ ...base, kind: "free" }, { db, config })).ok, false);
  assert.equal((await startPayment({ ...base, strategyId: undefined }, { db, config })).ok, false);

  assert.ok((await startPayment(base, { db, config })).ok);
  const again = await startPayment(base, { db, config });
  assert.equal(again.ok, false, "a second prompt to the same phone within 2 minutes is refused");

  stkFails = true;
  const other = { ...base, phone: "0722000111" };
  const failed = await startPayment(other, { db, config });
  assert.equal(failed.ok, false);
  const [row] = await db!.query<{ status: string }>(`select status from payments where phone = '254722000111'`);
  assert.equal(row.status, "failed");
  for (let i = 0; i < 3; i++) await startPayment(other, { db, config });
  const blocked = await startPayment(other, { db, config });
  assert.equal(!blocked.ok && blocked.status, 429, "stops before PayHero's own 10-failure block");

  const off = await startPayment(base, { db, config: { ...config, token: null } });
  assert.equal(!off.ok && off.status, 503);
  const noDb = await startPayment(base, { db: null, config });
  assert.equal(!noDb.ok && noDb.status, 503);
});

test("admin sessions are signed and expire", async () => {
  process.env.ADMIN_PASSWORD = "correct horse";
  const s = await createSession(Date.now());
  assert.equal(await verifySession(s), true);
  assert.equal(await verifySession(s.replace(/.$/, (c) => (c === "0" ? "1" : "0"))), false);
  assert.equal(await verifySession(`${Date.now() + 1e9}.deadbeef`), false);
  assert.equal(await verifySession(await createSession(Date.now() - 13 * 3600_000)), false);
  assert.equal(await verifySession(undefined), false);
});
