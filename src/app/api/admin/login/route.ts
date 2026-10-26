import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, SESSION_HOURS, adminConfigured, createSession, passwordMatches } from "@/lib/server/admin-auth";

export const runtime = "nodejs";

// Slow down guessing: per server instance, 10 tries per 15 minutes per IP.
const tries = new Map<string, number[]>();

export async function POST(req: NextRequest) {
  if (!adminConfigured()) {
    return NextResponse.json({ error: "Admin isn't set up yet: add ADMIN_PASSWORD in Vercel." }, { status: 503 });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const now = Date.now();
  const recent = (tries.get(ip) ?? []).filter((t) => now - t < 15 * 60_000);
  if (recent.length >= 10) return NextResponse.json({ error: "Too many attempts. Wait 15 minutes." }, { status: 429 });

  let password = "";
  try {
    password = String((await req.json()).password ?? "");
  } catch {
    // treated as a wrong password
  }
  if (!(await passwordMatches(password))) {
    recent.push(now);
    tries.set(ip, recent);
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }
  tries.delete(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, await createSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
  return res;
}
