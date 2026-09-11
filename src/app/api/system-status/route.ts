import { NextResponse } from "next/server";

// Read-only status check for the admin Settings page. Never returns the key
// itself — only whether one is configured — so this is safe to expose
// without any additional auth beyond the page-level admin gate.

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    llmConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
  });
}
