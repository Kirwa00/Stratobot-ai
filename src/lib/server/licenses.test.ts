import test from "node:test";
import assert from "node:assert/strict";
import { getDb, resetDbForTests } from "./db";
import { activateLicense, issueLicense, licenseForPayment, LICENSE_KEY_RE, normalizeLicenseKey } from "./licenses";

const machine = (n: number) => String(n).repeat(64).slice(0, 64).replace(/[^a-f0-9]/g, "a");

test("issues one key per payment and limits activations per key", async () => {
  process.env.LOCAL_DB_DIR = "memory://";
  resetDbForTests();
  const db = (await getDb())!;
  const payment = { id: "SB-TEST-ABC123", client_id: "client-123456", phone: "254712345678" };
  const key = await issueLicense(db, payment);
  assert.match(key, LICENSE_KEY_RE);
  assert.equal(await issueLicense(db, payment), key);
  assert.equal(await licenseForPayment(db, payment.id), key);
  assert.equal(normalizeLicenseKey(key.toLowerCase()), key);

  const a = await activateLicense({ key, machineId: machine(1) }, { db });
  assert.deepEqual(a, { ok: true, machines: 1, maxMachines: 2 });
  assert.equal((await activateLicense({ key, machineId: machine(1) }, { db })).ok, true);
  assert.equal((await activateLicense({ key, machineId: machine(2) }, { db })).ok, true);
  const third = await activateLicense({ key, machineId: machine(3) }, { db });
  assert.equal(third.ok, false);
  assert.equal(!third.ok && third.status, 409);
  assert.equal((await activateLicense({ key, machineId: machine(1) }, { db })).ok, true);

  const missing = await activateLicense({ key: "SBD-AAAA-BBBB-CCCC-DDDD", machineId: machine(1) }, { db });
  assert.equal(!missing.ok && missing.status, 404);
  assert.equal((await activateLicense({ key: "nope", machineId: machine(1) }, { db })).ok, false);

  await db.query(`update licenses set revoked = true where key = $1`, [key]);
  const revoked = await activateLicense({ key, machineId: machine(1) }, { db });
  assert.equal(!revoked.ok && revoked.status, 403);
});
