import { NextRequest, NextResponse } from "next/server";
import { handleCallback } from "@/lib/server/payments";
import { payheroConfig } from "@/lib/server/payhero";

// PayHero posts here when the customer answers the M-Pesa prompt. The secret in
// the URL keeps out random posts; the payment itself is still re-checked with
// PayHero's status API before anything is unlocked (payments.ts).
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { callbackSecret } = payheroConfig();
  if (!callbackSecret || req.nextUrl.searchParams.get("secret") !== callbackSecret) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const handled = await handleCallback(body);
  return NextResponse.json({ received: true, handled });
}
