import { test } from "node:test";
import assert from "node:assert/strict";
import { EXAMPLE_STRATEGIES } from "../constants";
import { newStrategyName, parsePrompt } from "../parser";
import { blocksToRules } from "./from-blocks";
import { validateRules } from "./validate";
import { composeMQL5FromStrategy } from "../deterministic-composer";
import { runStrategySimulation, strategyRules } from "../simulate";
import { CONFIDENCE_THRESHOLD, type Strategy } from "../types";

// The examples a first-time user starts from go through the keyword parser, the
// path every visitor takes while the AI translator has no API key.

function fromPrompt(rawPrompt: string): Strategy {
  const p = parsePrompt(rawPrompt);
  return { id: "s", name: "Example", rawPrompt, readback: p.readback, blocks: p.blocks, unmapped: p.unmapped, createdAt: 0, updatedAt: 0 };
}

test("every offered example builds a two-sided bot with a stop loss and no warnings", () => {
  for (const ex of EXAMPLE_STRATEGIES) {
    const s = fromPrompt(ex);
    assert.deepEqual(s.unmapped, [], ex);
    const rules = blocksToRules(s.blocks);
    assert.ok(rules.long && rules.long.length > 0, `${ex}: no buy rules`);
    assert.ok(rules.short && rules.short.length > 0, `${ex}: no sell rules`);
    assert.ok(rules.exits.stopLoss, `${ex}: no stop loss`);
    const v = validateRules(rules);
    assert.ok(v.ok && v.warnings.length === 0, `${ex}: ${v.ok ? v.warnings.join("; ") : v.errors.join("; ")}`);
    const c = composeMQL5FromStrategy(s);
    assert.ok(c.ok && c.notes.length === 0, ex);
  }
});

test("every offered example trades on the logic check, both ways, with explanations", () => {
  for (const ex of EXAMPLE_STRATEGIES) {
    const trades = [0, 1, 2, 3].flatMap((run) => runStrategySimulation(fromPrompt(ex), run).trades);
    assert.ok(trades.some((t) => t.direction === "buy"), `${ex}: no buys`);
    assert.ok(trades.some((t) => t.direction === "sell"), `${ex}: no sells`);
    for (const t of trades) assert.ok(t.why && t.why.length > 0, `${ex}: unexplained trade`);
  }
});

test("block strategies' logic check runs the compiled rules, not random trades", () => {
  const s = fromPrompt(EXAMPLE_STRATEGIES[0]);
  assert.deepEqual(strategyRules(s), blocksToRules(s.blocks));
  const r = runStrategySimulation(s, 0);
  assert.ok(r.trades.length > 0);
  for (const t of r.trades) assert.ok(t.why!.some((line) => line.includes("EMA")), "trade not explained by its EMA rule");
});

test("a block strategy without exits gets a download warning", () => {
  const s = fromPrompt("Wait for a bullish order block in New York, enter on engulfing candle");
  const c = composeMQL5FromStrategy(s);
  assert.ok(c.ok && c.notes.some((n) => n.startsWith("Nothing ever closes a trade")));
});

test("exit-only and empty descriptions produce no rules to confirm", () => {
  assert.equal(strategyRules(fromPrompt("trail stop 30 pips")), null);
  assert.equal(strategyRules(fromPrompt("hello there")), null);
});

test("the parser reads moving-average periods and type instead of silently using defaults", () => {
  const ma = (text: string) => parsePrompt(text).blocks.find((b) => b.blockId === "ma_cross")!;
  assert.deepEqual(ma("50/200 SMA cross, stop loss 50 pips").params, { fast: 50, slow: 200, type: "SMA" });
  assert.deepEqual(ma("enter on a 20-50 ema crossover").params, { fast: 20, slow: 50, type: "EMA" });
  assert.deepEqual(ma("21/9 EMA cross").params, { fast: 9, slow: 21, type: "EMA" });
  const dir = (text: string) => parsePrompt(text).blocks.find((b) => b.blockId === "engulfing")!.params.direction;
  assert.equal(dir("bullish or bearish engulfing candle"), "Either");
  assert.equal(dir("bearish engulfing candle"), "Bearish");
  assert.equal(dir("engulfing candle after a pullback setup"), "Either"); // "setup" isn't "up"; no direction stated = default
  for (const ex of EXAMPLE_STRATEGIES) {
    for (const b of parsePrompt(ex).blocks) assert.ok(b.confidence >= CONFIDENCE_THRESHOLD, `${ex}: ${b.blockId} flagged as unsure`);
  }
});

test("strategies are named from the trader's own words", () => {
  assert.equal(newStrategyName("9/21 EMA cross, stop loss 20 pips"), "9/21 EMA cross");
  assert.equal(newStrategyName(""), "My strategy");
  assert.ok(newStrategyName("London session only enter on a bullish or bearish engulfing candle").length <= 41);
});
