const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const licence = require("../licence");

const KEY = "SBD-ABCD-EFGH-JKLM-NP23";
const tmpStore = () => licence.createStore(path.join(fs.mkdtempSync(path.join(os.tmpdir(), "sb-")), "licence.json"), null);
const reply = (status, body = {}) => async () => ({ ok: status < 300, status, json: async () => body });
const offline = async () => {
  throw new Error("ENOTFOUND");
};

test("normalizes keys", () => {
  assert.equal(licence.normalizeKey(" sbd-abcd-efgh-jklm-np23 "), KEY);
  assert.equal(licence.normalizeKey("SBD-ABCD-EFGH-JKLM-NP2O"), null);
  assert.equal(licence.normalizeKey(""), null);
});

test("machine id is a stable sha256", () => {
  assert.match(licence.machineId(), /^[a-f0-9]{64}$/);
  assert.equal(licence.machineId(), licence.machineId());
});

test("stored licence: ok refreshes, invalid clears, offline uses the grace period", async () => {
  const store = tmpStore();
  assert.deepEqual(await licence.verifyStored(store, "https://x", "m", { fetchImpl: reply(200) }), { allowed: false });

  store.save({ key: KEY, lastOk: 0 });
  const ok = await licence.verifyStored(store, "https://x", "m", { fetchImpl: reply(200), now: 1000 });
  assert.equal(ok.allowed, true);
  assert.equal(store.load().lastOk, 1000);

  const graced = await licence.verifyStored(store, "https://x", "m", { fetchImpl: offline, now: 2000 });
  assert.equal(graced.allowed, true);
  assert.equal(graced.offline, true);
  const expired = await licence.verifyStored(store, "https://x", "m", { fetchImpl: offline, now: 1000 + licence.OFFLINE_GRACE_MS + 1 });
  assert.equal(expired.allowed, false);

  const down = await licence.verifyStored(store, "https://x", "m", { fetchImpl: reply(503), now: 3000 });
  assert.equal(down.allowed, true);

  const revoked = await licence.verifyStored(store, "https://x", "m", { fetchImpl: reply(403, { error: "switched off" }), now: 3000 });
  assert.deepEqual(revoked, { allowed: false, error: "switched off" });
  assert.equal(store.load(), null);
});
