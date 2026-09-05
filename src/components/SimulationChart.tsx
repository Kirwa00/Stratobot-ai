"use client";

import type { SimulationResult } from "@/lib/types";

const WIDTH = 640;
const HEIGHT = 260;
const PAD_X = 12;
const PAD_Y = 20;

function y(v: number) {
  return PAD_Y + (1 - v) * (HEIGHT - PAD_Y * 2);
}

const OUTCOME_COLOR: Record<string, string> = {
  target: "var(--buy)",
  stopped: "var(--sell)",
  open: "var(--outline)",
};

export function SimulationChart({ result }: { result: SimulationResult }) {
  const { candles, trades } = result;
  const n = candles.length;
  const step = (WIDTH - PAD_X * 2) / n;
  const bodyWidth = Math.max(1.5, step * 0.6);

  function x(i: number) {
    return PAD_X + i * step + step / 2;
  }

  return (
    <div className="flex flex-col gap-2">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-auto rounded-lg border border-outline bg-slate"
        role="img"
        aria-label={`Synthetic price path with ${trades.length} simulated trades`}
      >
        {candles.map((c, i) => {
          const up = c.close >= c.open;
          const color = up ? "var(--buy)" : "var(--sell)";
          const bodyTop = y(Math.max(c.open, c.close));
          const bodyHeight = Math.max(1, Math.abs(y(c.open) - y(c.close)));
          return (
            <g key={i} opacity={0.9}>
              <line x1={x(i)} x2={x(i)} y1={y(c.high)} y2={y(c.low)} stroke={color} strokeWidth={1} />
              <rect x={x(i) - bodyWidth / 2} y={bodyTop} width={bodyWidth} height={bodyHeight} fill={color} />
            </g>
          );
        })}

        {trades.map((t, i) => {
          const entryX = x(t.candle);
          const entryY = y(candles[t.candle].close);
          const up = t.direction === "buy";
          const entryColor = up ? "var(--buy)" : "var(--sell)";
          const exitColor = OUTCOME_COLOR[t.outcome];

          return (
            <g
              key={i}
              className="animate-draw-in"
              style={{ animationDelay: `${i * 70}ms`, transformOrigin: `${entryX}px ${entryY}px` }}
            >
              {t.exitCandle !== undefined && (
                <>
                  <line
                    x1={entryX}
                    y1={entryY}
                    x2={x(t.exitCandle)}
                    y2={y(candles[t.exitCandle].close)}
                    stroke={exitColor}
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                  />
                  <circle cx={x(t.exitCandle)} cy={y(candles[t.exitCandle].close)} r={2.5} fill={exitColor} />
                </>
              )}
              <circle cx={entryX} cy={entryY} r={3} fill={entryColor} stroke="var(--slate)" strokeWidth={1} />
              <path
                d={
                  up
                    ? `M${entryX} ${entryY - 12} l-4 6 h8 z`
                    : `M${entryX} ${entryY + 12} l-4 -6 h8 z`
                }
                fill={entryColor}
              />
            </g>
          );
        })}
      </svg>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1 text-[11px] text-chalk/60">
        <LegendItem swatch="var(--buy)" label="Bullish candle" />
        <LegendItem swatch="var(--sell)" label="Bearish candle" />
        <LegendItem swatch="var(--buy)" label="Target hit" dashed />
        <LegendItem swatch="var(--sell)" label="Stopped out" dashed />
        <LegendItem swatch="var(--outline)" label="Still open" dashed />
      </div>
    </div>
  );
}

function LegendItem({ swatch, label, dashed }: { swatch: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block w-3 h-0"
        style={{
          borderTop: dashed ? `2px dashed ${swatch}` : `3px solid ${swatch}`,
        }}
      />
      {label}
    </span>
  );
}
