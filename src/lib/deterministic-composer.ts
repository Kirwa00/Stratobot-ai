// Deterministic Code Composer
// Engineering Plan v1.2 §1: "LLM never writes a line of MQL5. It does exactly one job:
// translate trader language into a strict, schema-validated Blueprint JSON. A deterministic
// code composer then assembles the .mq5 file from a library of hand-written, pre-compiled,
// individually-tested MQL5 block templates."
//
// Every generated file is compiled against real MetaEditor before template
// changes ship; see mql5-templates.ts for the template contract.

import { getBlock } from "./blocks";
import { getMQL5Template, type MQL5Template } from "./mql5-templates";
import type { BlockDef, BlockInstance, ParamDef, Strategy } from "./types";

export type ComposeResult =
  | { ok: true; code: string; notes: string[] }
  | { ok: false; error: string };

interface Part {
  def: BlockDef;
  template: MQL5Template;
  /** Replaces {blockId}: the block id, or id_2, id_3... for repeat instances. */
  token: string;
}

/** Plain-English caveats about how this EA will behave, shown before download. */
const NOTES = {
  noDirection:
    "None of your rules decides buy vs. sell, so the bot won't trade until you set its \"If no rule picks a direction\" input to Buy or Sell in MetaTrader.",
  riskWithoutStop:
    "Risk Per Trade needs a Stop Loss to size trades from, and this strategy has none, so it uses a fixed lot size instead.",
  rrWithoutStops:
    "Risk : Reward compares your Take Profit to your Stop Loss, so it has no effect unless the strategy has both.",
  newsInTester:
    "The News Filter uses MetaTrader's live economic calendar, which doesn't exist in the Strategy Tester, so backtests will ignore it.",
};

export function composeMQL5FromStrategy(strategy: Strategy): ComposeResult {
  const counts = new Map<string, number>();
  const parts: { part: Part; block: BlockInstance }[] = [];

  for (const block of strategy.blocks ?? []) {
    const def = getBlock(block.blockId);
    const template = getMQL5Template(block.blockId);
    if (!def || !template) continue;
    const n = (counts.get(def.id) ?? 0) + 1;
    counts.set(def.id, n);
    parts.push({ part: { def, template, token: n === 1 ? def.id : `${def.id}_${n}` }, block });
  }

  if (!parts.some(({ part }) => part.def.role !== "exit")) {
    return {
      ok: false,
      error:
        "This strategy only has exit rules (like a stop or trailing stop), so there's nothing that tells the bot when to open a trade. Add at least one entry rule and try again.",
    };
  }

  const first = (id: string) => parts.find(({ part }) => part.def.id === id)?.part;
  const has = (id: string) => first(id) !== undefined;

  const notes: string[] = [];
  if (!parts.some(({ part }) => part.template.votes)) notes.push(NOTES.noDirection);
  if (has("risk_per_trade") && !has("stop_loss")) notes.push(NOTES.riskWithoutStop);
  if (has("risk_reward") && !(has("stop_loss") && has("take_profit"))) notes.push(NOTES.rrWithoutStops);
  if (has("news_filter")) notes.push(NOTES.newsInTester);

  const blockCode = parts.map(({ part, block }) =>
    applyParams(part.template.code.replace(/\{blockId\}/g, part.token), part, block)
  );

  return { ok: true, code: buildFile(strategy, parts.map((p) => p.part), blockCode, first), notes };
}

function buildFile(
  strategy: Strategy,
  parts: Part[],
  blockCode: string[],
  first: (id: string) => Part | undefined
): string {
  const call = (p: Part, prefix: "Check_" | "Apply_") =>
    p.template.functions.find((f) => f.startsWith(prefix))?.replace(/\{blockId\}/g, p.token);

  const entryChecks = parts
    .filter((p) => p.def.role !== "exit")
    .flatMap((p) => {
      const fn = call(p, "Check_");
      return fn ? [`   // ${p.def.label}`, `   if (!${fn}()) return false;`] : [];
    });

  const exitCalls = parts
    .filter((p) => p.def.role === "exit")
    .flatMap((p) => {
      const fn = call(p, "Apply_");
      return fn ? [`   ${fn}();`] : [];
    });

  const sl = first("stop_loss");
  const tp = first("take_profit");
  const size = first("position_size");
  const risk = first("risk_per_trade");
  const rr = first("risk_reward");
  const news = first("news_filter");

  const initNotes: string[] = [];
  if (risk && !sl) initNotes.push(`   Print("StratoBot: ${NOTES.riskWithoutStop}");`);
  if (rr && !(sl && tp)) initNotes.push(`   Print("StratoBot: ${NOTES.rrWithoutStops}");`);
  if (news) initNotes.push(`   if (MQLInfoInteger(MQL_TESTER)) Print("StratoBot: ${NOTES.newsInTester}");`);

  const title = safeComment(strategy.name || "Untitled Strategy").slice(0, 52);
  const generated = Number.isFinite(strategy.updatedAt) ? new Date(strategy.updatedAt).toISOString() : "";

  return `//+------------------------------------------------------------------+
//| StratoBot AI - Generated Expert Advisor
//| Strategy: ${title}
//| Generated: ${generated}
//|
//| Review this EA and run it on a demo account before trading real money.
//+------------------------------------------------------------------+
#property copyright "StratoBot AI"
#property link "https://www.stratobot.trade"
#property version "1.00"

#include <Trade\\Trade.mqh>

input long   InpMagic = ${magicNumber(strategy.id)}; // Magic number (identifies this EA's trades)
input double InpDefaultLots = 0.1; // Lot size when no sizing rule applies
input string InpNoSignalDirection = "Skip"; // If no rule picks a direction: Skip, Buy, Sell
input int    InpCooldownSeconds = 60; // Minimum seconds between entries

CTrade trade;
datetime lastTradeTime = 0;
int g_dir = 0;
bool g_dirConflict = false;
datetime g_lastWarnBar = 0;

// 1 pip = 10 points on 5- and 3-digit quotes (most brokers), 1 point otherwise.
double StratoPip() {
   return (_Digits == 3 || _Digits == 5) ? _Point * 10.0 : _Point;
}

// Directional rules vote +1 (buy) or -1 (sell); disagreeing votes cancel the trade.
void Vote(int dir) {
   if (dir == 0) return;
   if (g_dir == 0) g_dir = dir;
   else if (g_dir != dir) g_dirConflict = true;
}

// Call after PositionSelectByTicket(): true only for this EA's own positions.
bool IsOwnPosition() {
   return PositionGetString(POSITION_SYMBOL) == _Symbol && PositionGetInteger(POSITION_MAGIC) == InpMagic;
}

// Journal message, at most one per bar so a blocked condition doesn't flood the log every tick.
void StratoWarn(string message) {
   datetime bar = iTime(_Symbol, _Period, 0);
   if (bar == g_lastWarnBar) return;
   g_lastWarnBar = bar;
   Print("StratoBot: ", message);
}

//+------------------------------------------------------------------+
//| Strategy rules                                                   |
//+------------------------------------------------------------------+
${blockCode.join("\n")}

//+------------------------------------------------------------------+
//| Sizing and stops                                                 |
//+------------------------------------------------------------------+
double StratoSLPips() {
   return ${sl ? `${sl.token}_distance` : "0"};
}

double StratoTPPips() {
   return ${tp ? `${tp.token}_distance` : "0"};
}

double NormalizeLots(double lots) {
   double step = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
   double minLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   if (step <= 0) step = 0.01;
   lots = MathFloor(lots / step + 1e-9) * step;
   if (lots < minLot) return 0;
   if (maxLot > 0 && lots > maxLot) lots = maxLot;
   return NormalizeDouble(lots, 8);
}

double StratoLots() {
   double lots = ${size ? `${size.token}_size` : "InpDefaultLots"};
${
  risk && sl
    ? `   // Size so that hitting the Stop Loss loses ${risk.token}_percent of the balance${size ? " (the fixed Position Size acts as a cap)" : ""}.
   double riskMoney = AccountInfoDouble(ACCOUNT_BALANCE) * ${risk.token}_percent / 100.0;
   double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double tickSize = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   double stopDistance = StratoSLPips() * StratoPip();
   if (tickValue > 0 && tickSize > 0 && stopDistance > 0) {
      double riskLots = riskMoney / ((stopDistance / tickSize) * tickValue);
      lots = ${size ? "MathMin(lots, riskLots)" : "riskLots"};
   }
`
    : ""
}   return NormalizeLots(lots);
}

//+------------------------------------------------------------------+
//| Expert lifecycle                                                 |
//+------------------------------------------------------------------+
int OnInit() {
   trade.SetExpertMagicNumber(InpMagic);
   trade.SetDeviationInPoints(10);
   trade.SetTypeFillingBySymbol(_Symbol);
${initNotes.join("\n")}
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason) {
}

int CountOwnPositions() {
   int count = 0;
   for (int i = PositionsTotal() - 1; i >= 0; i--) {
      ulong ticket = PositionGetTicket(i);
      if (ticket > 0 && PositionSelectByTicket(ticket) && IsOwnPosition()) count++;
   }
   return count;
}

void OnTick() {
   if (CountOwnPositions() > 0) {
      ManageExits();
      return;
   }
   if (TimeCurrent() - lastTradeTime < InpCooldownSeconds) return;
   if (CheckEntry()) OpenPosition();
}

bool CheckEntry() {
   g_dir = 0;
   g_dirConflict = false;

${entryChecks.join("\n")}
   return true;
}

void OpenPosition() {
   if (g_dirConflict) {
      StratoWarn("rules pointed in opposite directions (buy and sell), so no trade was opened");
      return;
   }
   int dir = g_dir;
   if (dir == 0) {
      if (InpNoSignalDirection == "Buy") dir = 1;
      else if (InpNoSignalDirection == "Sell") dir = -1;
      else {
         StratoWarn("entry conditions met, but no rule picks buy or sell; set the 'If no rule picks a direction' input to trade");
         return;
      }
   }

   double lots = StratoLots();
   if (lots <= 0) {
      StratoWarn("calculated lot size is below this symbol's minimum, so no trade was opened");
      return;
   }

   double price = dir > 0 ? SymbolInfoDouble(_Symbol, SYMBOL_ASK) : SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double sl = 0;
   double tp = 0;
   if (StratoSLPips() > 0) sl = NormalizeDouble(price - dir * StratoSLPips() * StratoPip(), _Digits);
   if (StratoTPPips() > 0) tp = NormalizeDouble(price + dir * StratoTPPips() * StratoPip(), _Digits);

   bool sent = dir > 0 ? trade.Buy(lots, _Symbol, 0, sl, tp, "StratoBot")
                       : trade.Sell(lots, _Symbol, 0, sl, tp, "StratoBot");
   if (sent && (trade.ResultRetcode() == TRADE_RETCODE_DONE || trade.ResultRetcode() == TRADE_RETCODE_PLACED)) {
      lastTradeTime = TimeCurrent();
   } else {
      StratoWarn("order was rejected: " + trade.ResultRetcodeDescription());
   }
}

void ManageExits() {
${exitCalls.length ? exitCalls.join("\n") : "   // No exit rules: positions are closed manually or by the broker."}
}
`;
}

/** Rewrites each block's `input` default to the trader's value (clamped / validated
 *  against the block library), so the file reflects what they actually configured. */
function applyParams(code: string, part: Part, block: BlockInstance): string {
  let out = code;
  for (const p of part.def.params) {
    const re = new RegExp(`^(input\\s+(\\w+)\\s+${part.token}_${p.key}\\s*=\\s*)[^;]*;`, "m");
    const match = out.match(re);
    if (!match) throw new Error(`MQL5 template for "${part.def.id}" has no input for param "${p.key}"`);
    const literal = toLiteral(match[2], normalizeParam(p, block.params?.[p.key]));
    out = out.replace(re, (_all, head: string) => `${head}${literal};`);
  }
  return out;
}

function normalizeParam(p: ParamDef, raw: string | number | undefined): string | number {
  if (p.type === "number") {
    const n = Number(raw);
    if (raw === undefined || raw === "" || !Number.isFinite(n)) return p.default;
    return Math.min(p.max ?? Infinity, Math.max(p.min ?? -Infinity, n));
  }
  if (p.type === "select") {
    return p.options?.some((o) => o.value === raw) ? String(raw) : p.default;
  }
  return typeof raw === "string" && raw ? raw : p.default;
}

function toLiteral(mqlType: string, value: string | number): string {
  if (mqlType === "string") {
    return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/[\r\n]/g, " ")}"`;
  }
  const n = Number(value);
  return mqlType === "int" || mqlType === "long" ? String(Math.round(n)) : String(n);
}

function safeComment(text: string): string {
  return text.replace(/[\x00-\x1f\x7f]/g, " ");
}

/** Stable per-strategy magic number, so two StratoBot EAs on one account don't manage each other's trades. */
function magicNumber(id: string): number {
  let h = 0;
  for (const ch of id ?? "") h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return 100000 + (h % 900000);
}
