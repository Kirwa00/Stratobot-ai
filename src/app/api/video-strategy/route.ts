import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { MODEL } from "@/lib/rules/translate-server";
import {
  MAX_DESCRIPTION_CHARS,
  MAX_TRANSCRIPT_CHARS,
  VIDEO_SYSTEM_PROMPT,
  VideoStrategySchema,
  videoUserMessage,
  youtubeId,
  type VideoMeta,
} from "@/lib/video-strategy";

// GET  ?url=…  → the video's title, channel and thumbnail (YouTube's official oEmbed).
// POST {url?, transcript} → the strategy the transcript teaches, as a plain-language
// description for the normal translate flow. The transcript comes from the trader.

export const runtime = "nodejs";
export const maxDuration = 120;

async function videoMeta(input: string): Promise<VideoMeta | null> {
  const id = youtubeId(input);
  if (!id) return null;
  const url = `https://www.youtube.com/watch?v=${id}`;
  try {
    const res = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const o = (await res.json()) as { title?: string; author_name?: string; thumbnail_url?: string };
    return { id, url, title: o.title ?? "", channel: o.author_name ?? "", thumbnail: o.thumbnail_url ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const meta = await videoMeta(req.nextUrl.searchParams.get("url") ?? "");
  if (!meta) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(meta);
}

// Best-effort burst guard, per server instance (same approach as /api/translate).
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 15;
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

export async function POST(req: NextRequest) {
  let body: { url?: unknown; transcript?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const transcript = typeof body.transcript === "string" ? body.transcript.trim() : "";
  if (transcript.length < 40) return NextResponse.json({ error: "transcript_too_short" }, { status: 400 });
  if (transcript.length > MAX_TRANSCRIPT_CHARS) return NextResponse.json({ error: "transcript_too_long" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "ai_unavailable" }, { status: 503 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const meta = typeof body.url === "string" && body.url ? await videoMeta(body.url) : null;

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 8000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      output_config: { effort: "medium", format: betaZodOutputFormat(VideoStrategySchema) },
      system: [{ type: "text", text: VIDEO_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: videoUserMessage(meta, transcript) }],
    });
    const out = response.parsed_output;
    if (response.stop_reason === "refusal" || !out) {
      return NextResponse.json({ error: "extraction_failed" }, { status: 502 });
    }
    return NextResponse.json({
      meta,
      strategy: { ...out, description: out.description.slice(0, MAX_DESCRIPTION_CHARS) },
    });
  } catch (err) {
    console.error("[/api/video-strategy] extraction failed", err);
    return NextResponse.json({ error: "extraction_failed" }, { status: 502 });
  }
}
