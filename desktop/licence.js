// Licence key storage and checks against stratobot.trade.
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const KEY_RE = /^SBD(-[A-HJ-NP-Z2-9]{4}){4}$/;
/** How long the app keeps working when stratobot.trade can't be reached. */
const OFFLINE_GRACE_MS = 14 * 24 * 60 * 60 * 1000;

function normalizeKey(input) {
  const k = String(input ?? "").trim().toUpperCase().replace(/\s+/g, "");
  return KEY_RE.test(k) ? k : null;
}

function windowsMachineGuid() {
  try {
    const out = execFileSync("reg", ["query", "HKLM\\SOFTWARE\\Microsoft\\Cryptography", "/v", "MachineGuid"], {
      encoding: "utf8",
      windowsHide: true,
    });
    return /MachineGuid\s+REG_SZ\s+(\S+)/i.exec(out)?.[1] ?? null;
  } catch {
    return null;
  }
}

/** A stable, hashed id for this PC (never the raw hardware id). */
function machineId() {
  const raw = (process.platform === "win32" && windowsMachineGuid()) || [os.hostname(), os.platform(), os.arch(), os.cpus()[0]?.model ?? ""].join("|");
  return crypto.createHash("sha256").update(`stratobot-desktop:${raw}`).digest("hex");
}

/** `crypt` is Electron's safeStorage (or a stand-in in tests). */
function createStore(file, crypt) {
  const canEncrypt = () => {
    try {
      return Boolean(crypt?.isEncryptionAvailable());
    } catch {
      return false;
    }
  };
  return {
    load() {
      try {
        const raw = fs.readFileSync(file, "utf8");
        const json = raw.startsWith("enc:") ? crypt.decryptString(Buffer.from(raw.slice(4), "base64")) : raw;
        const data = JSON.parse(json);
        return normalizeKey(data.key) ? data : null;
      } catch {
        return null;
      }
    },
    save(data) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const json = JSON.stringify(data);
      fs.writeFileSync(file, canEncrypt() ? `enc:${crypt.encryptString(json).toString("base64")}` : json);
    },
    clear() {
      fs.rmSync(file, { force: true });
    },
  };
}

/** → { status: "ok" } | { status: "invalid", error } | { status: "offline" } */
async function checkKey(site, key, machine, fetchImpl = fetch) {
  try {
    const res = await fetchImpl(`${site.replace(/\/$/, "")}/api/desktop/activate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, machineId: machine }),
      signal: AbortSignal.timeout(15_000),
    });
    if (res.ok) return { status: "ok" };
    const body = await res.json().catch(() => ({}));
    if (res.status >= 400 && res.status < 500 && res.status !== 429) {
      return { status: "invalid", error: body.error || "This licence key isn't valid." };
    }
    return { status: "offline" };
  } catch {
    return { status: "offline" };
  }
}

/** Decide on launch whether a stored licence still opens the app. */
async function verifyStored(store, site, machine, { fetchImpl = fetch, now = Date.now() } = {}) {
  const saved = store.load();
  if (!saved) return { allowed: false };
  const r = await checkKey(site, saved.key, machine, fetchImpl);
  if (r.status === "ok") {
    store.save({ key: saved.key, lastOk: now });
    return { allowed: true, key: saved.key };
  }
  if (r.status === "invalid") {
    store.clear();
    return { allowed: false, error: r.error };
  }
  const fresh = typeof saved.lastOk === "number" && now - saved.lastOk < OFFLINE_GRACE_MS;
  return fresh ? { allowed: true, key: saved.key, offline: true } : { allowed: false, error: "Connect to the internet to check your licence." };
}

module.exports = { KEY_RE, OFFLINE_GRACE_MS, normalizeKey, machineId, createStore, checkKey, verifyStored };
