// Deterministic Code Composer
// Engineering Plan v1.2 §1: "LLM never writes a line of MQL5." Blocks are
// translated into the rule language (rules/from-blocks.ts) and compiled by a
// deterministic compiler (rules/compile-mql5.ts) whose output is checked
// against a reference interpreter in the MT5 Strategy Tester (scripts/mt5).

import { getBlock } from "./blocks";
import { compileRules } from "./rules/compile-mql5";
import { blocksToRules, hasContradictoryDirections } from "./rules/from-blocks";
import { validateRules } from "./rules/validate";
import type { Strategy } from "./types";

export type ComposeResult =
  | { ok: true; code: string; notes: string[] }
  | { ok: false; error: string };

export function composeMQL5FromStrategy(strategy: Strategy): ComposeResult {
  if (strategy.rules) return composeFromRules(strategy);
  const blocks = (strategy.blocks ?? []).filter((b) => getBlock(b.blockId));

  if (!blocks.some((b) => getBlock(b.blockId)!.role !== "exit")) {
    return {
      ok: false,
      error:
        "This strategy only has exit rules (like a stop or trailing stop), so there's nothing that tells the bot when to open a trade. Add at least one entry rule and try again.",
    };
  }

  const rules = blocksToRules(blocks);
  if (hasContradictoryDirections(rules)) {
    return {
      ok: false,
      error:
        "Some of your rules only allow buys and others only allow sells, so they can never agree and the bot would never trade. Remove or change one side and try again.",
    };
  }

  const notes: string[] = [];
  if (rules.directionFromInput) {
    notes.push(
      "None of your rules decides buy vs. sell, so the bot won't trade until you set its \"If no rule picks a direction\" input to Buy or Sell in MetaTrader."
    );
  }
  if (rules.sizing.riskPercent && !rules.exits.stopLoss) {
    notes.push("Risk Per Trade needs a Stop Loss to size trades from, and this strategy has none, so it uses a fixed lot size instead.");
  }
  if (rules.guards.minRewardRisk && !(rules.exits.stopLoss && rules.exits.takeProfit)) {
    notes.push("Risk : Reward compares your Take Profit to your Stop Loss, so it has no effect unless the strategy has both.");
  }
  if (rules.guards.news) {
    notes.push("The News Filter uses MetaTrader's live economic calendar, which doesn't exist in the Strategy Tester, so backtests will ignore it.");
  }

  const code = compileRules(rules, { name: strategy.name, id: strategy.id, updatedAt: strategy.updatedAt });
  return { ok: true, code, notes };
}

/** Strategies the AI translator built in the rule language. Re-validated here
 *  because the stored strategy comes back from the browser's localStorage. */
function composeFromRules(strategy: Strategy): ComposeResult {
  const v = validateRules(strategy.rules);
  if (!v.ok) {
    return {
      ok: false,
      error: "This strategy's saved rules are damaged or out of date, so no bot was built. Describe your strategy again and try once more.",
    };
  }
  const rules = v.rules;
  const notes = [...v.warnings];
  if (rules.directionFromInput) {
    notes.push(
      "None of your rules decides buy vs. sell, so the bot won't trade until you set its \"If no rule picks a direction\" input to Buy or Sell in MetaTrader."
    );
  }
  for (const u of strategy.unmapped ?? []) {
    notes.push(`Not built: "${u.text}"${u.reason ? ` (${u.reason})` : ""}. The bot does not do this.`);
  }
  const code = compileRules(rules, { name: strategy.name, id: strategy.id, updatedAt: strategy.updatedAt });
  return { ok: true, code, notes };
}
