import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/server/admin-data";
import { payheroConfig, paymentChannels, PayHeroError } from "@/lib/server/payhero";

// "Test connection" on the admin settings page: lists the PayHero account's
// payment channels with the configured token and marks the one in use.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const c = payheroConfig();
  if (!c.token) return NextResponse.json({ ok: false, error: "PAYHERO_BASIC_AUTH is not set." });
  try {
    const channels = await paymentChannels(c);
    return NextResponse.json({
      ok: true,
      channels: channels.map((ch) => ({
        id: ch.id,
        type: ch.channel_type,
        description: ch.description ?? "",
        shortCode: ch.short_code ?? "",
        active: ch.is_active,
        selected: ch.id === c.channelId,
      })),
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof PayHeroError ? err.message : "Couldn't reach PayHero." });
  }
}
