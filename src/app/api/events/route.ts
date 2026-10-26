import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { RECORDED_EVENTS } from "@/lib/events";

// First-party funnel events for the admin dashboard. Only fixed event names and
// small enum/number properties are accepted; anything else is dropped.
export const runtime = "nodejs";

const ALLOWED = new Set<string>(RECORDED_EVENTS);

export async function POST(req: NextRequest) {
  let body: { type?: unknown; clientId?: unknown; props?: unknown };
  try {
    body = JSON.parse(await req.text());
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  const type = typeof body.type === "string" ? body.type : "";
  if (!ALLOWED.has(type)) return new NextResponse(null, { status: 204 });
  const clientId = typeof body.clientId === "string" && /^[\w-]{8,64}$/.test(body.clientId) ? body.clientId : null;
  const props: Record<string, string | number | boolean> = {};
  if (body.props && typeof body.props === "object") {
    for (const [k, v] of Object.entries(body.props as Record<string, unknown>).slice(0, 8)) {
      if (!/^\w{1,32}$/.test(k)) continue;
      if (typeof v === "number" || typeof v === "boolean") props[k] = v;
      else if (typeof v === "string" && v.length <= 40) props[k] = v;
    }
  }
  try {
    const db = await getDb();
    if (db) await db.query(`insert into events (type, client_id, data) values ($1, $2, $3)`, [type, clientId, JSON.stringify(props)]);
  } catch (err) {
    // never break the page over analytics
    console.error("[/api/events] not recorded", err);
  }
  return new NextResponse(null, { status: 204 });
}
