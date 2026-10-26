import { NextRequest, NextResponse } from "next/server";
import { publicStatus, refreshPayment } from "@/lib/server/payments";

// Polled by the checkout screen. Only the browser that started the payment
// (same client id) can read it, and it never sees the phone number.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  const client = req.nextUrl.searchParams.get("client") ?? "";
  if (!/^SB-[A-Z0-9]+-[A-F0-9]{6}$/.test(id)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const row = await refreshPayment(id);
  if (!row || row.client_id !== client) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(publicStatus(row), { headers: { "Cache-Control": "no-store" } });
}
