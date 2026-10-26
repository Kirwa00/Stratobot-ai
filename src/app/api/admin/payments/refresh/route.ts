import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/server/admin-data";
import { refreshPayment } from "@/lib/server/payments";

// Admin "Re-check with PayHero" for a payment still waiting.
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const row = await refreshPayment(id);
  return row ? NextResponse.json({ status: row.status }) : NextResponse.json({ error: "not_found" }, { status: 404 });
}
