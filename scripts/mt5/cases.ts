import { BLOCKS } from "../../src/lib/blocks";
import type { BlockInstance } from "../../src/lib/types";

// Strategies the MT5 differential test runs: every block on its own, the
// param variants that take different code paths, and a few combinations.

function inst(blockId: string, params: Record<string, string | number> = {}): BlockInstance {
  const def = BLOCKS.find((b) => b.id === blockId);
  if (!def) throw new Error(`unknown block ${blockId}`);
  const p: Record<string, string | number> = {};
  for (const d of def.params) p[d.key] = d.default;
  return { instanceId: blockId, blockId, params: { ...p, ...params }, confidence: 1 };
}

export const CASES: Record<string, BlockInstance[]> = {
  ...Object.fromEntries(
    BLOCKS.filter((b) => b.role !== "exit").map((b) => [`single_${b.id}`, [inst(b.id)]])
  ),
  sweep_low: [inst("sweep", { of: "Previous Day Low" })],
  rsi_overbought: [inst("rsi", { condition: "Overbought (>70)" })],
  bollinger_upper: [inst("bollinger", { touch: "Upper band" })],
  bollinger_squeeze: [inst("bollinger", { touch: "Squeeze" })],
  vwap_reclaim: [inst("vwap", { condition: "VWAP reclaim" })],
  htf_daily: [inst("htf_confirmation", { timeframe: "Daily" })],
  htf_weekly: [inst("htf_confirmation", { timeframe: "Weekly" })],
  pdh_both_fib618: [inst("pdh", { side: "Both" }), inst("fib50", { level: "61.8%" })],
  sma_cross: [inst("ma_cross", { type: "SMA", fast: 10, slow: 30 })],
  duplicate_ma_cross: [inst("ma_cross", { fast: 9, slow: 21 }), inst("ma_cross", { fast: 50, slow: 200 })],
  homepage_example: [inst("killzone"), inst("sweep"), inst("fib50"), inst("trailing_stop")],
  ny_engulfing_htf: [inst("killzone", { session: "New York" }), inst("engulfing"), inst("htf_confirmation")],
};
