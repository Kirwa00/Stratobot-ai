import { NextResponse } from "next/server";
import { databaseMode } from "@/lib/server/db";
import { payheroReady } from "@/lib/server/payhero";

// Whether the buy buttons should take payments. No secrets, just a yes/no.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ live: payheroReady() && databaseMode() !== "none" });
}
