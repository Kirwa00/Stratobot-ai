import { NextRequest, NextResponse } from "next/server";
import { startPayment } from "@/lib/server/payments";

// Starts an M-Pesa payment: the server sets the price and sends the STK prompt.
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const r = await startPayment({
    kind: body.kind,
    phone: body.phone,
    clientId: body.clientId,
    strategyId: body.strategyId,
    strategyName: body.strategyName,
  });
  return r.ok ? NextResponse.json({ id: r.id }) : NextResponse.json({ error: r.error }, { status: r.status });
}
