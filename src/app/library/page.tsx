"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { useStrategyStore } from "@/lib/store";
import { trackEvent } from "@/lib/analytics";
import { MAX_TRANSCRIPT_CHARS, youtubeId, type VideoMeta, type VideoStrategy } from "@/lib/video-strategy";

// Build an EA from a trading video. The trader pastes the link (we show the
// video via YouTube's official oEmbed) and the video's transcript, which
// YouTube shows under every video. Claude writes down the strategy the video
// teaches and lists what it leaves open; the trader edits it, then it goes
// through the same readback → logic check → download flow as a typed strategy.

const ERRORS: Record<string, string> = {
  transcript_too_short: "Paste the transcript (or your notes on the video) first.",
  transcript_too_long: `That's over ${MAX_TRANSCRIPT_CHARS.toLocaleString("en-GB")} characters. Paste just the part that explains the strategy.`,
  ai_unavailable: "Reading videos needs StratoBot's AI service, which isn't switched on right now. You can still type the strategy yourself on the main screen.",
  rate_limited: "Too many videos in the last hour. Try again later.",
  extraction_failed: "Couldn't read a strategy from that. Try pasting just the part where the rules are explained.",
};

export default function VideoStrategyPage() {
  const router = useRouter();
  const { startFromPrompt, parsing } = useStrategyStore();
  const urlId = useId();
  const transcriptId = useId();
  const descriptionId = useId();

  const [url, setUrl] = useState("");
  const [meta, setMeta] = useState<VideoMeta | null>(null);
  const [metaState, setMetaState] = useState<"idle" | "loading" | "ok" | "bad">("idle");
  const [transcript, setTranscript] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VideoStrategy | null>(null);
  const [description, setDescription] = useState("");

  // Look the video up once the link parses.
  const id = youtubeId(url);
  useEffect(() => {
    if (!id) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setMeta(null);
      setMetaState(url.trim() ? "bad" : "idle");
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }
    let cancelled = false;
    setMetaState("loading");
    fetch(`/api/video-strategy?url=${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? (r.json() as Promise<VideoMeta>) : null))
      .then((m) => {
        if (cancelled) return;
        setMeta(m);
        setMetaState(m ? "ok" : "bad");
      })
      .catch(() => !cancelled && setMetaState("bad"));
    return () => {
      cancelled = true;
    };
  }, [id, url]);

  async function extract() {
    setError(null);
    setResult(null);
    setExtracting(true);
    try {
      const res = await fetch("/api/video-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: id ?? "", transcript }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(ERRORS[data.error] ?? ERRORS.extraction_failed);
        return;
      }
      setResult(data.strategy);
      setDescription(data.strategy.description);
      if (data.strategy.found) trackEvent("video_strategy_found");
    } catch {
      setError(ERRORS.extraction_failed);
    } finally {
      setExtracting(false);
    }
  }

  async function build() {
    const text = description.trim();
    if (!text) return;
    await startFromPrompt(text);
    router.push("/readback");
  }

  return (
    <div className="flex flex-col flex-1">
      <Header back title="From a video" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">Build the strategy from a YouTube video</h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            Paste a trading video and its transcript. StratoBot writes down the rules the video
            teaches, tells you what it leaves out, and builds them into an MT5 EA you can check
            first.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={urlId} className="text-sm font-medium text-chalk">
            1. YouTube link
          </label>
          <input
            id={urlId}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
            inputMode="url"
            className="rounded-lg border border-outline bg-slate-high text-chalk placeholder:text-chalk/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-secondary"
          />
          {metaState === "bad" && <p className="text-xs text-sell">That doesn&apos;t look like a YouTube video link.</p>}
          {metaState === "loading" && <p className="text-xs text-chalk/50">Finding the video…</p>}
          {meta && (
            <div className="flex gap-3 items-center rounded-lg border border-outline bg-slate p-2 mt-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={meta.thumbnail} alt="" className="w-28 aspect-video object-cover rounded" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-chalk line-clamp-2">{meta.title}</p>
                <p className="text-xs text-chalk/60">{meta.channel}</p>
                <a href={meta.url} target="_blank" rel="noopener noreferrer" className="text-xs text-secondary hover:underline">
                  Open on YouTube
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={transcriptId} className="text-sm font-medium text-chalk">
            2. The video&apos;s transcript
          </label>
          <p className="text-xs text-chalk/60 leading-relaxed">
            On YouTube, open the description (&ldquo;…more&rdquo;) and press{" "}
            <span className="font-semibold">Show transcript</span>. Select the transcript text, copy it
            and paste it here. No transcript? Write the rules the video explains in your own words.
          </p>
          <textarea
            id={transcriptId}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={8}
            maxLength={MAX_TRANSCRIPT_CHARS}
            placeholder="0:00 Today I'll show you my London breakout strategy…"
            className="rounded-lg border border-outline bg-slate-high text-chalk placeholder:text-chalk/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-secondary"
          />
          <Button onClick={extract} disabled={transcript.trim().length < 40 || extracting} className="mt-1">
            {extracting ? "Reading the video…" : "Find the strategy"}
          </Button>
          {error && (
            <p role="alert" className="text-xs text-sell">
              {error}
            </p>
          )}
        </div>

        {result && !result.found && (
          <div className="rounded-lg border border-caution/50 bg-slate px-4 py-3.5">
            <p className="text-sm font-semibold text-chalk mb-1">No tradable strategy found</p>
            <ul className="text-sm text-chalk/75 list-disc pl-5">
              {result.missing.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        )}

        {result?.found && (
          <section className="flex flex-col gap-3">
            <label htmlFor={descriptionId} className="text-sm font-medium text-chalk">
              3. The strategy, as the video teaches it{result.name ? `: ${result.name}` : ""}
            </label>
            <p className="text-xs text-chalk/60">Edit anything before building. Fill in what the video left out.</p>
            <textarea
              id={descriptionId}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="rounded-lg border border-outline bg-slate-high text-chalk px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-secondary"
            />
            {result.missing.length > 0 && (
              <div className="rounded-lg border border-caution/50 bg-slate px-4 py-3">
                <p className="text-xs font-mono font-bold tracking-wider uppercase text-caution mb-1.5">Not in the video</p>
                <ul className="text-sm text-chalk/80 list-disc pl-5 flex flex-col gap-1">
                  {result.missing.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.discretionary.length > 0 && (
              <div className="rounded-lg border border-outline bg-slate px-4 py-3">
                <p className="text-xs font-mono font-bold tracking-wider uppercase text-chalk/50 mb-1.5">
                  Judgement calls an EA can&apos;t make
                </p>
                <ul className="text-sm text-chalk/80 list-disc pl-5 flex flex-col gap-1">
                  {result.discretionary.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
            <Button onClick={build} disabled={!description.trim() || parsing}>
              {parsing ? "Reading your strategy…" : "Build this strategy"}
            </Button>
            <p className="text-xs text-chalk/50 leading-relaxed">
              Next you&apos;ll see exactly what the EA will do, rule by rule, and can run a logic
              check before downloading. A video&apos;s strategy isn&apos;t a promise of profit.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
