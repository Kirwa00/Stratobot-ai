import { test } from "node:test";
import assert from "node:assert/strict";
import { CASES } from "../../../scripts/mt5/cases";
import { EXAMPLES } from "./translate";
import { simulateRules } from "./synthetic";

test("the rules logic check runs every verified case and example without throwing", () => {
  const all = [...Object.values(CASES), ...EXAMPLES.map((e) => e.output.rules!)];
  let fired = 0;
  for (const rules of all) {
    const r = simulateRules(rules, 0);
    assert.equal(r.candles.length, 150);
    for (const c of r.candles) assert.ok(c.low >= 0 && c.high <= 1 && c.low <= c.high);
    for (const t of r.trades) {
      assert.ok(t.candle >= 0 && t.candle < r.candles.length);
      if (t.exitCandle !== undefined) assert.ok(t.exitCandle >= t.candle);
    }
    if (r.trades.length) fired++;
  }
  // Almost every verified strategy trades somewhere on a 150-candle random path.
  assert.ok(fired >= all.length * 0.7, `${fired} of ${all.length} fired`);
});

test("the rules logic check is deterministic per run and differs between runs", () => {
  const rules = EXAMPLES[0].output.rules!;
  const a = simulateRules(rules, 3);
  const b = simulateRules(rules, 3);
  assert.deepEqual(a.trades, b.trades);
  assert.deepEqual(a.candles, b.candles);
  assert.notDeepEqual(simulateRules(rules, 4).candles, a.candles);
});
