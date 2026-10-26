import { NextRequest, NextResponse } from "next/server";
import { loadSeries } from "@/lib/market/provider";
import { toPayload } from "@/lib/market/types";
import type { Timeframe } from "@/lib/rules/types";

// Historical candles for the logic check. 404 when no data provider is
// configured or it has nothing for this symbol/timeframe; the client then
// stays on the synthetic path.

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") ?? "";
  const tf = (req.nextUrl.searchParams.get("tf") ?? "") as Timeframe;
  const series = await loadSeries(symbol, tf);
  if (!series) return NextResponse.json({ unavailable: true }, { status: 404 });
  return NextResponse.json(toPayload(series), { headers: { "Cache-Control": "private, max-age=3600" } });
}
