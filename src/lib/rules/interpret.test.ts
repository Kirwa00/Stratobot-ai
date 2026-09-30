import { test } from "node:test";
import assert from "node:assert/strict";
import * as ind from "./indicators";
import { Interpreter, type Candle } from "./interpret";
import { blocksToRules, hasContradictoryDirections } from "./from-blocks";
import type { Condition, RuleStrategy, Value } from "./types";
import type { BlockInstance } from "../types";

const HOUR = 3600;
const DAY = 86400;
const PIP = 0.0001;

function candle(time: number, open: number, high: number, low: number, close: number, tickVolume = 1): Candle {
  return { time, open, high, low, close, tickVolume };
}

/** Flat hourly candles starting at a Monday 00:00 (server time). */
function hourly(count: number, start = 4 * DAY, price = 1.1): Candle[] {
  return Array.from({ length: count }, (_, i) => candle(start + i * HOUR, price, price + 0.001, price - 0.001, price));
}

function strategy(parts: Partial<RuleStrategy>): RuleStrategy {
  return { version: 1, timeframe: "chart", filters: [], long: null, short: null, exits: {}, sizing: {}, guards: {}, ...parts };
}

function evalValue(candles: Candle[], v: Value, t: number, offset = 0) {
  return new Interpreter(strategy({}), candles, { pip: PIP, serverGmtOffsetHours: 0 }).value(v, t, offset);
}

function evalCondition(candles: Candle[], c: Condition, t: number, serverGmtOffsetHours = 0) {
  return new Interpreter(strategy({}), candles, { pip: PIP, serverGmtOffsetHours }).condition(c, t, 0);
}

test("indicators match MT5 conventions on simple series", () => {
  assert.deepEqual(ind.sma([1, 2, 3, 4], 2).slice(1), [1.5, 2.5, 3.5]);
  assert.deepEqual(ind.ema([2, 2, 2], 5), [2, 2, 2]);
  assert.equal(ind.rsi([1, 2, 3, 4, 5, 6], 3)[5], 100);
  assert.equal(ind.rsi([6, 5, 4, 3, 2, 1], 3)[5], 0);
  assert.equal(ind.rsi([1, 1, 1, 1, 1], 3)[4], 50);
  // Constant 0.002 ranges and flat closes: ATR (a simple average of true range in MT5) is 0.002.
  const n = 20;
  assert.ok(Math.abs(ind.atr(Array(n).fill(1.101), Array(n).fill(1.099), Array(n).fill(1.1), 14)[19] - 0.002) < 1e-12);
  const flatMacd = ind.macd(Array(40).fill(1.1), 12, 26, 9);
  assert.ok(Math.abs(flatMacd.main[39]) < 1e-12 && Math.abs(flatMacd.signal[39]) < 1e-12);
  const b = ind.bands(Array(25).fill(1.1), 20, 2);
  assert.equal(b.upper[24], b.lower[24]);
});

test("shift 0 is the most recently closed bar, never the one that just opened", () => {
  const c = hourly(10).map((x, i) => ({ ...x, close: 1 + i }));
  assert.equal(evalValue(c, { kind: "price", field: "close" }, 5), 5); // bar 4 closed, bar 5 just opened
  assert.equal(evalValue(c, { kind: "price", field: "close", shift: 2 }, 5), 3);
  assert.equal(evalValue(c, { kind: "price", field: "close" }, 5, 1), 4); // offset 1 = one decision earlier
  assert.ok(Number.isNaN(evalValue(c, { kind: "price", field: "close" }, 0)));
});

test("higher timeframe values use the last fully closed higher-timeframe bar", () => {
  const c = hourly(48);
  c[5] = { ...c[5], high: 1.25 }; // day 1 high
  c[30] = { ...c[30], high: 1.5 }; // day 2, before the decision
  const t = 34; // day 2, 10:00
  assert.equal(evalValue(c, { kind: "price", field: "high", tf: "D1" }, t), 1.25);
  assert.equal(evalValue(c, { kind: "highest", bars: 5 }, t), 1.5);
});

test("sessions are evaluated in GMT using the broker offset", () => {
  const c = hourly(24);
  const london: Condition = { kind: "session", name: "london" };
  assert.equal(evalCondition(c, london, 10, 2), true); // 10:00 server = 08:00 GMT
  assert.equal(evalCondition(c, london, 9, 2), false); // 07:00 GMT
  assert.equal(evalCondition(c, london, 9, 0), true);
});

test("cross needs the previous bar on the other side", () => {
  const closes = [1.0, 1.0, 1.0, 0.9, 1.2, 1.3, 1.3];
  const c = hourly(closes.length).map((x, i) => ({ ...x, close: closes[i] }));
  const cond: Condition = { kind: "cross", a: { kind: "price", field: "close" }, dir: "above", b: { kind: "const", value: 1.1 } };
  assert.equal(evalCondition(c, cond, 5), true); // closed bars 3 (0.9) -> 4 (1.2)
  assert.equal(evalCondition(c, cond, 6), false); // 1.2 -> 1.3: already above
});

test("within looks back over earlier decisions", () => {
  const closes = [1, 1, 2, 1, 1, 1];
  const c = hourly(closes.length).map((x, i) => ({ ...x, close: closes[i] }));
  const spike: Condition = { kind: "compare", a: { kind: "price", field: "close" }, op: "gt", b: { kind: "const", value: 1.5 } };
  assert.equal(evalCondition(c, { kind: "within", bars: 3, of: spike }, 5), true); // bar 2 is 3 decisions back
  assert.equal(evalCondition(c, { kind: "within", bars: 2, of: spike }, 5), false);
});

test("candle patterns", () => {
  const base = hourly(6);
  base[3] = candle(base[3].time, 1.105, 1.106, 1.099, 1.1); // bearish
  base[4] = candle(base[4].time, 1.099, 1.108, 1.098, 1.107); // bullish, engulfs it
  assert.equal(evalCondition(base, { kind: "pattern", pattern: "engulfing", side: "bullish" }, 5), true);
  assert.equal(evalCondition(base, { kind: "pattern", pattern: "engulfing", side: "bearish" }, 5), false);

  const gap = hourly(6);
  gap[2] = candle(gap[2].time, 1.1, 1.101, 1.099, 1.1);
  gap[4] = candle(gap[4].time, 1.102, 1.103, 1.1017, 1.1025); // low 1.1017 vs high 1.101 two bars earlier = 7 pips
  assert.equal(evalCondition(gap, { kind: "pattern", pattern: "fvg", side: "bullish", minPips: 5 }, 5), true);
  assert.equal(evalCondition(gap, { kind: "pattern", pattern: "fvg", side: "bullish", minPips: 8 }, 5), false);
});

test("block translation keeps each block's direction", () => {
  const block = (blockId: string, params: Record<string, string | number> = {}): BlockInstance => ({
    instanceId: blockId,
    blockId,
    params,
    confidence: 1,
  });
  const sweep = blocksToRules([block("sweep", { of: "Previous Day High" })]);
  assert.equal(sweep.long, null);
  assert.equal(sweep.short?.length, 1);

  const onlyTiming = blocksToRules([block("killzone", { session: "London" })]);
  assert.equal(onlyTiming.directionFromInput, true);

  const contradiction = blocksToRules([block("sweep", { of: "Previous Day High" }), block("rsi", { condition: "Oversold (<30)", period: 14 })]);
  assert.equal(hasContradictoryDirections(contradiction), true);

  const exits = blocksToRules([block("killzone"), block("stop_loss", { distance: 15 }), block("take_profit", { distance: 5000 })]);
  assert.deepEqual(exits.exits.stopLoss, { kind: "pips", pips: 15 });
  assert.deepEqual(exits.exits.takeProfit, { kind: "pips", pips: 1000 }); // clamped to the block's max
});
