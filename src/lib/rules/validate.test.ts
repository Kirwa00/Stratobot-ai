import { test } from "node:test";
import assert from "node:assert/strict";
import { CASES } from "../../../scripts/mt5/cases";
import { validateRules } from "./validate";
import { describeRules, readbackText } from "./describe";
import type { RuleStrategy } from "./types";

const base = (parts: Partial<RuleStrategy> = {}): RuleStrategy => ({
  version: 1,
  timeframe: "H1",
  filters: [],
  long: [{ kind: "cross", a: { kind: "ma", method: "ema", period: 9 }, dir: "above", b: { kind: "ma", method: "ema", period: 21 } }],
  short: null,
  exits: { stopLoss: { kind: "pips", pips: 20 } },
  sizing: {},
  guards: {},
  ...parts,
});

function errors(x: unknown): string[] {
  const r = validateRules(x);
  return r.ok ? [] : r.errors;
}

test("every MT5-verified case passes validation unchanged", () => {
  for (const [name, s] of Object.entries(CASES)) {
    const r = validateRules(JSON.parse(JSON.stringify(s)));
    assert.ok(r.ok, `${name}: ${r.ok ? "" : r.errors.join("; ")}`);
    if (r.ok) assert.deepEqual(r.rules, JSON.parse(JSON.stringify(s)), name);
  }
});

test("every MT5-verified case has a readback", () => {
  for (const [name, s] of Object.entries(CASES)) {
    const text = readbackText(describeRules(s));
    assert.ok(text.length > 20, name);
    assert.ok(!/undefined|NaN|\[object/.test(text), `${name}: ${text}`);
  }
});

test("rejects unknown fields, kinds and bad numbers", () => {
  assert.ok(errors({ ...base(), extra: 1 }).some((e) => e.includes("rules.extra: unknown field")));
  assert.ok(errors(base({ long: [{ kind: "vibes" } as never] })).some((e) => e.includes("unknown condition kind")));
  assert.ok(errors(base({ long: [{ kind: "compare", a: { kind: "rsi", period: 0 }, op: "lt", b: { kind: "const", value: 30 } }] })).length);
  assert.ok(errors(base({ long: [{ kind: "compare", a: { kind: "rsi", period: 14.5 }, op: "lt", b: { kind: "const", value: 30 } }] })).length);
  assert.ok(errors(base({ long: [{ kind: "compare", a: { kind: "rsi", period: 14 }, op: "lt", b: { kind: "const", value: NaN } }] })).length);
  assert.ok(errors(base({ exits: { stopLoss: { kind: "pips", pips: -5 } } })).length);
  assert.ok(errors(base({ exits: { stopLoss: { kind: "rr", multiple: 2 } as never } })).length);
  assert.ok(errors(base({ long: [{ kind: "compare", a: { kind: "macd", fast: 26, slow: 12, signal: 9, line: "main" }, op: "gt", b: { kind: "const", value: 0 } }] })).length);
  assert.ok(errors(null).length);
  assert.ok(errors("rules").length);
});

test("rejects strategies that can never trade or contradict themselves", () => {
  assert.ok(errors(base({ long: null, short: null })).some((e) => e.includes("can never trade")));
  assert.ok(errors(base({ directionFromInput: true })).some((e) => e.includes("directionFromInput")));
  assert.ok(errors(base({ entry: { short: { type: "limit", at: { kind: "const", value: 1 }, expiresBars: 3 } } })).length);
  assert.ok(errors(base({ filters: [{ kind: "time_window", fromHour: 8, toHour: 8 }] })).length);
  assert.ok(errors(base({ long: [{ kind: "compare", a: { kind: "ma", method: "sma", period: 20, tf: "M15" }, op: "gt", b: { kind: "const", value: 1 } }] })).some((e) => e.includes("lower than the strategy timeframe")));
});

test("rejects excessive nesting", () => {
  let c: unknown = { kind: "session", name: "london" };
  for (let i = 0; i < 20; i++) c = { kind: "not", of: c };
  assert.ok(errors(base({ filters: [c as never] })).some((e) => e.includes("nested")));
});

test("warns about legal but ineffective settings", () => {
  const r = validateRules(base({ exits: { takeProfit: { kind: "rr", multiple: 2 } }, sizing: { riskPercent: 1 } }));
  assert.ok(r.ok);
  if (r.ok) {
    assert.ok(r.warnings.some((w) => w.includes("Risk-based sizing needs a stop loss")));
    assert.ok(r.warnings.some((w) => w.includes("risk:reward take profit")));
  }
});

test("readback reads like the rules", () => {
  const r = describeRules(
    base({
      filters: [{ kind: "session", name: "london" }],
      long: [
        { kind: "cross", a: { kind: "ma", method: "ema", period: 9 }, dir: "above", b: { kind: "ma", method: "ema", period: 21 } },
        { kind: "compare", a: { kind: "rsi", period: 14, tf: "H4" }, op: "lt", b: { kind: "const", value: 70 } },
      ],
      short: [{ kind: "pattern", pattern: "engulfing", side: "bearish" }],
      exits: { stopLoss: { kind: "atr", multiple: 1.5, period: 14 }, takeProfit: { kind: "rr", multiple: 2 } },
      sizing: { riskPercent: 1 },
    })
  );
  assert.equal(r.filters[0], "it is the London session (08:00-17:00 GMT)");
  assert.equal(r.long![0], "the 9 EMA crosses above the 21 EMA");
  assert.equal(r.long![1], "RSI(14) (4-hour) is below 70");
  assert.equal(r.short![0], "there is a bearish engulfing candle on the last closed candle");
  assert.deepEqual(r.exits, ["Stop loss 1.5 x ATR(14) from entry.", "Take profit 2 times the stop-loss distance from entry."]);
  assert.deepEqual(r.sizing, ["Size each trade so hitting the stop loss loses 1% of the balance."]);
});
