"use client";

import { useEffect, useRef } from "react";
import { EXPLAINER, clock, explainerJsonLd } from "@/lib/video";

// The 59-second narrated StratoBot explainer (a longer cut with old beta pricing is on YouTube).
// preload="none" + a poster keeps the 4.8 MB file from loading until someone
// presses play. On the page Google indexes it on (withSchema), it carries
// VideoObject structured data and clickable chapters; ?t=31 seeks to 0:31,
// which is what the structured data's key moments link to.

export function ExplainerVideo({
  caption = true,
  withSchema = false,
  chapters = false,
}: {
  caption?: boolean;
  withSchema?: boolean;
  chapters?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!withSchema) return;
    const t = Number(new URLSearchParams(window.location.search).get("t"));
    const v = ref.current;
    if (v && Number.isFinite(t) && t > 0 && t < EXPLAINER.durationSec) {
      v.preload = "metadata";
      v.currentTime = t;
      v.scrollIntoView({ block: "center" });
    }
  }, [withSchema]);

  function jump(t: number) {
    const v = ref.current;
    if (!v) return;
    v.currentTime = t;
    void v.play();
  }

  return (
    <figure className="w-full">
      {withSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(explainerJsonLd()) }} />
      )}
      <video
        ref={ref}
        controls
        playsInline
        preload="none"
        poster={EXPLAINER.poster}
        title={EXPLAINER.title}
        aria-label={`Video: ${EXPLAINER.title}`}
        className="w-full aspect-video rounded-2xl border border-outline bg-[#0b0a08] shadow-lift"
      >
        <source src={EXPLAINER.src} type="video/mp4" />
        Your browser can&apos;t play this video. <a href={EXPLAINER.src}>Download the explainer (MP4)</a>.
      </video>
      {caption && (
        <figcaption className="mt-3 text-xs text-chalk/60">
          {chapters ? EXPLAINER.title : "A 1-minute narrated walkthrough: describe, review, check, download."}{" "}
          <a
            href={EXPLAINER.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-chalk"
          >
            Watch on YouTube
            <span className="material-symbols-outlined text-sm" aria-hidden="true">open_in_new</span>
          </a>
        </figcaption>
      )}
      {chapters && (
        <nav aria-label="Video chapters" className="mt-4">
          <p className="text-sm font-semibold text-chalk mb-2">In this video</p>
          <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
            {EXPLAINER.chapters.map((c) => (
              <li key={c.t}>
                <button
                  type="button"
                  onClick={() => jump(c.t)}
                  className="flex gap-3 text-left text-sm text-chalk/75 hover:text-chalk focus-visible:outline-2 focus-visible:outline-signal rounded"
                >
                  <span className="mono-num text-chalk/50 w-9 shrink-0">{clock(c.t)}</span>
                  {c.label}
                </button>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm text-chalk/70 leading-relaxed">{EXPLAINER.description}</p>
        </nav>
      )}
    </figure>
  );
}
