"use client";

import { useState } from "react";
import { EXPLAINER } from "@/lib/video";

// The explainer as published on YouTube, for pages other than /how-it-works.
// Plays on youtube.com's player so views count toward the channel; shows only
// a local thumbnail until clicked, so the ~1 MB YouTube player never slows the page.

const ID = new URL(EXPLAINER.youtubeUrl).searchParams.get("v")!;

export function YouTubeExplainer({ heading = "Watch it in 1 minute" }: { heading?: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <section aria-label="Explainer video">
      <h2 className="font-display text-xl text-chalk mb-3">{heading}</h2>
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-outline bg-[#0b0a08] shadow-lift">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${ID}?autoplay=1&rel=0`}
            title={EXPLAINER.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play video: ${EXPLAINER.title}`}
            className="group absolute inset-0 w-full h-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/videos/stratobot-youtube-thumbnail.jpg" alt="" className="w-full h-full object-cover" loading="lazy" />
            <span className="absolute right-4 bottom-4 sm:right-6 sm:bottom-6">
              <span className="flex items-center justify-center w-16 h-16 rounded-full bg-[#ff0033] shadow-lift transition-transform group-hover:scale-105">
                <span className="material-symbols-outlined text-white text-4xl" aria-hidden="true">play_arrow</span>
              </span>
            </span>
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-chalk/60">
        {EXPLAINER.title}.{" "}
        <a href={EXPLAINER.youtubeUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-chalk">
          Open on YouTube
        </a>
      </p>
    </section>
  );
}
