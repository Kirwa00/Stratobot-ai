// Admin sign-in: one password (ADMIN_PASSWORD, set in Vercel) and a signed,
// expiring session cookie. Web Crypto only, so the same code runs in the proxy
// and in route handlers. With no ADMIN_PASSWORD set, admin is closed.

export const ADMIN_COOKIE = "sb_admin";
export const SESSION_HOURS = 12;

function secret(): string | null {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || null;
}

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

const enc = new TextEncoder();

async function hmac(key: string, data: string): Promise<string> {
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(data)));
  return Array.from(sig, (b) => b.toString(16).padStart(2, "0")).join("");
}

function equal(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Constant-time password check (both sides hashed first so length doesn't leak). */
export async function passwordMatches(input: string): Promise<boolean> {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return false;
  const key = "stratobot-admin-password";
  return equal(await hmac(key, input), await hmac(key, real));
}

export async function createSession(now = Date.now()): Promise<string> {
  const s = secret();
  if (!s) throw new Error("ADMIN_PASSWORD is not set");
  const exp = String(now + SESSION_HOURS * 3600_000);
  return `${exp}.${await hmac(s, `admin:${exp}`)}`;
}

export async function verifySession(cookie: string | undefined, now = Date.now()): Promise<boolean> {
  const s = secret();
  if (!s || !cookie) return false;
  const [exp, sig] = cookie.split(".");
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < now) return false;
  return equal(sig, await hmac(s, `admin:${exp}`));
}
