"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { useStrategyStore } from "@/lib/store";

const EXAMPLES = [
  "London killzone, sweep PDH, enter on 50% retrace, trail stop 30 pips",
  "Wait for a bullish order block in New York, enter on engulfing candle",
  "9/21 EMA cross when ATR is above average, trail stop 20 pips",
];

const HOW_IT_WORKS_KEY = "stratobot.howItWorksDismissed.v1";

const STEPS = [
  { icon: "edit_note", label: "Describe" },
  { icon: "science", label: "Check it" },
  { icon: "lock_open", label: "Unlock" },
  { icon: "download", label: "Download" },
] as const;

function HowItWorks({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="relative rounded-lg border border-outline bg-slate px-4 py-3.5 mb-5">
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="material-symbols-outlined absolute top-2 right-2 text-base text-chalk/40 p-1 rounded-md hover:bg-slate-high hover:text-chalk/70"
      >
        close
      </button>
      <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-3 pr-6">
        How it works
      </p>
      <div className="flex items-center justify-between mb-3">
        {STEPS.map((step, i) => (
          <div key={step.label} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1 flex-1">
              <span className="material-symbols-outlined text-signal text-xl">{step.icon}</span>
              <span className="text-xs font-medium text-chalk text-center">{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <span className="material-symbols-outlined text-outline text-base shrink-0 -mt-4">
                arrow_forward
              </span>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-chalk/60 leading-relaxed">
        Type your strategy in plain language, run a free logic check to see if your rules fire,
        then unlock once you&apos;re happy to download a bot for MetaTrader 5.
      </p>
    </div>
  );
}

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export function AppClient() {
  const router = useRouter();
  const { startFromPrompt, parsing } = useStrategyStore();
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [canListen, setCanListen] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  // Feature-detected client-side only, to avoid a server/client markup mismatch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanListen("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
    try {
      setShowHowItWorks(!window.localStorage.getItem(HOW_IT_WORKS_KEY));
    } catch {
      setShowHowItWorks(true);
    }
  }, []);

  function dismissHowItWorks() {
    setShowHowItWorks(false);
    try {
      window.localStorage.setItem(HOW_IT_WORKS_KEY, "1");
    } catch {
      // localStorage unavailable — dismissal just won't persist across visits
    }
  }

  function toggleListen() {
    if (!canListen) return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const w = window as unknown as Record<string, unknown>;
    const Ctor = (w.SpeechRecognition || w.webkitSpeechRecognition) as
      | (new () => SpeechRecognitionLike)
      | undefined;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setText((t) => (t ? `${t} ${transcript}` : transcript));
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }

  async function submit(value: string) {
    const trimmed = value.trim();
    if (!trimmed || parsing) return;
    await startFromPrompt(trimmed);
    router.push("/readback");
  }

  return (
    <div className="flex flex-col flex-1">
      <Header />
      <main className="flex-1 flex flex-col px-4 pt-6 pb-32 overflow-y-auto">
        <p className="text-sm text-chalk/70 leading-relaxed mb-5">
          Turn your trading strategy into an Expert Advisor without hiring a programmer.
        </p>

        {showHowItWorks && <HowItWorks onDismiss={dismissHowItWorks} />}

        <h1 className="font-display font-bold text-2xl text-chalk mb-4">
          What&apos;s your strategy?
        </h1>

        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="Type it the way you'd explain it to another trader."
            className="w-full resize-none rounded-lg border border-outline bg-slate text-chalk placeholder:text-chalk/40 px-4 py-3.5 pr-14 text-[15px] leading-relaxed focus:outline-none focus:ring-1 focus:ring-secondary"
          />
          {canListen && (
            <button
              onClick={toggleListen}
              aria-label="Voice input"
              className={`material-symbols-outlined absolute bottom-3 right-3 rounded-full p-2 ${
                listening ? "bg-signal text-white" : "bg-slate-high text-chalk/70"
              }`}
            >
              mic
            </button>
          )}
        </div>

        {!text && (
          <div className="mt-4 flex flex-col gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setText(ex)}
                className="text-left text-sm text-chalk/70 border border-outline rounded-md px-3 py-2 hover:bg-slate hover:text-chalk transition-colors"
              >
                &ldquo;{ex}&rdquo;
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 my-6">
          <div className="h-px bg-outline flex-1" />
          <span className="text-xs font-mono text-chalk/40 uppercase tracking-wider">or</span>
          <div className="h-px bg-outline flex-1" />
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/adjust?new=1">
            <Button variant="ghost" className="w-full">
              Build with blocks
            </Button>
          </Link>
          <Link href="/library">
            <Button variant="ghost" className="w-full">
              Browse video strategies
            </Button>
          </Link>
        </div>
      </main>

      <div className="sticky bottom-0 px-4 py-4 border-t border-outline bg-ink safe-bottom">
        <Button
          className="w-full"
          disabled={!text.trim() || parsing}
          onClick={() => submit(text)}
        >
          {parsing ? "Reading your strategy…" : "Read my strategy"}
        </Button>
      </div>
    </div>
  );
}
