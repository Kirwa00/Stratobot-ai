import { NextRequest, NextResponse } from "next/server";
import { activateLicense } from "@/lib/server/licenses";

// Called by the desktop app on activation and on each launch.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const r = await activateLicense({ key: body.key, machineId: body.machineId });
  return r.ok
    ? NextResponse.json({ ok: true, machines: r.machines, maxMachines: r.maxMachines })
    : NextResponse.json({ error: r.error }, { status: r.status });
}
