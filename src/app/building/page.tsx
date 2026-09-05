"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStrategyStore } from "@/lib/store";

const STAGES = [
  "Writing the entry rules",
  "Writing the exits",
  "Building the file",
  "Final checks",
];

const STAGE_MS = 1600;

export default function BuildingPage() {
  const router = useRouter();
  const { hydrated, strategy, paid } = useStrategyStore();
  const [stage, setStage] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!hydrated) return;
    if (!strategy || !paid) router.replace("/");
  }, [hydrated, strategy, paid, router]);

  useEffect(() => {
    const tick = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    if (stage >= STAGES.length - 1) {
      const t = window.setTimeout(() => router.replace("/download"), STAGE_MS);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setStage((s) => s + 1), STAGE_MS);
    return () => window.clearTimeout(t);
  }, [stage, router]);

  if (!strategy) return null;

  const taking_long = elapsed > 90;

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-8 text-center gap-6">
      <h1 className="font-display font-bold text-xl text-chalk">Building your bot</h1>

      <div className="flex items-center gap-2">
        {STAGES.map((_, i) => (
          <span
            key={i}
            className={`h-2.5 rounded-full transition-all ${
              i < stage
                ? "w-2.5 bg-signal"
                : i === stage
                ? "w-6 bg-signal"
                : "w-2.5 bg-outline"
            }`}
          />
        ))}
      </div>

      <p className="text-[15px] text-chalk/90">{STAGES[stage]}</p>

      <p className="text-sm text-chalk/50">
        {taking_long ? "Taking longer than usual — still working." : "Usually takes about 40 seconds."}
      </p>
    </div>
  );
}
