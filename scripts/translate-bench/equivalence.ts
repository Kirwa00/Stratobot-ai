import { execute, type TradeEvent } from "../../src/lib/rules/execute";
import { Interpreter } from "../../src/lib/rules/interpret";
import { TF_SECONDS, buildPath, lookback, seededRandom, ticksFor } from "../../src/lib/rules/synthetic";
import type { RuleStrategy, Timeframe } from "../../src/lib/rules/types";

// Behavioural equivalence of two rule strategies: run both on the same
// synthetic markets and compare every bar's decision and every trade event.
// Two formulations that always do the same thing score as identical.

export interface Behaviour {
  timeframeMatch: boolean;
  /** Bars where either strategy signalled. */
  signalBars: number;
  /** Share of those bars where both made the same decision (1 when neither ever signalled). */
  signalAgreement: number;
  expectedTrades: number;
  actualTrades: number;
  tradesIdentical: boolean;
  /** First differing trade event, for the report. */
  firstDiff?: string;
}

const MARKET_BARS = 2000;
const PIP = 0.0001;
const POINT = 0.00001;

function eventKey(e: TradeEvent): string {
  const r = (x: number) => x.toFixed(5);
  switch (e.kind) {
    case "open":
      return `${e.time} open ${e.dir} ${r(e.price)} sl=${r(e.sl)} tp=${r(e.tp)} lots=${e.lots.toFixed(2)}`;
    case "place":
      return `${e.time} place ${e.dir} ${e.type} ${r(e.price)} sl=${r(e.sl)} tp=${r(e.tp)} lots=${e.lots.toFixed(2)}`;
    case "fill":
      return `${e.time} fill ${r(e.price)}`;
    case "modify":
      return `${e.time} modify sl=${r(e.sl)} tp=${r(e.tp)}`;
    case "partial":
      return `${e.time} partial ${r(e.price)} ${e.lots.toFixed(2)}`;
    case "close":
      return `${e.time} close ${e.reason} ${r(e.price)}`;
    case "cancel":
      return `${e.time} cancel`;
  }
}

export function compareBehaviour(expected: RuleStrategy, actual: RuleStrategy, seeds = [11, 22, 33]): Behaviour {
  const baseTf: Timeframe = expected.timeframe === "chart" ? "H1" : expected.timeframe;
  const baseSeconds = TF_SECONDS[baseTf];
  const warmup = Math.max(lookback(expected, baseSeconds), lookback(actual, baseSeconds));

  let signalBars = 0;
  let agreed = 0;
  let expectedTrades = 0;
  let actualTrades = 0;
  let firstDiff: string | undefined;

  for (const seed of seeds) {
    const candles = buildPath(warmup + MARKET_BARS, baseSeconds, seededRandom(seed));
    const opts = { pip: PIP, serverGmtOffsetHours: 0 };
    const ie = new Interpreter(expected, candles, opts);
    const ia = new Interpreter(actual, candles, opts);
    for (let t = warmup; t < candles.length; t++) {
      const e = ie.decide(t);
      const a = ia.decide(t);
      const eKey = `${e.long}|${e.short}|${expected.directionFromInput ? e.filters : "-"}`;
      const aKey = `${a.long}|${a.short}|${actual.directionFromInput ? a.filters : "-"}`;
      const any = e.long || e.short || a.long || a.short || (expected.directionFromInput && e.filters) || (actual.directionFromInput && a.filters);
      if (!any) continue;
      signalBars++;
      if (eKey === aKey) agreed++;
    }

    const ticks = ticksFor(candles, warmup, baseSeconds);
    const run = (s: RuleStrategy) =>
      execute(s, candles, ticks, {
        ...opts,
        symbol: { digits: 5, point: POINT, volumeStep: 0.01, volumeMin: 0.01, volumeMax: 100, tickValue: 1, tickSize: POINT },
        initialBalance: 10000,
        startBar: candles[warmup - 1].time,
        noSignalDirection: "buy",
      }).map(eventKey);
    const ee = run(expected);
    const ea = run(actual);
    expectedTrades += ee.filter((k) => / (open|fill) /.test(k)).length;
    actualTrades += ea.filter((k) => / (open|fill) /.test(k)).length;
    if (!firstDiff) {
      const i = ee.findIndex((k, j) => k !== ea[j]);
      if (i >= 0 || ee.length !== ea.length) {
        const j = i >= 0 ? i : Math.min(ee.length, ea.length);
        firstDiff = `seed ${seed}: expected ${ee[j] ?? "(none)"} | got ${ea[j] ?? "(none)"}`;
      }
    }
  }

  return {
    timeframeMatch: expected.timeframe === actual.timeframe,
    signalBars,
    signalAgreement: signalBars ? agreed / signalBars : 1,
    expectedTrades,
    actualTrades,
    tradesIdentical: firstDiff === undefined,
    firstDiff,
  };
}
