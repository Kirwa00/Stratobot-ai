import { SAR_WINDOW } from "./indicators";
import { buildNodeTable, stableKey } from "./nodes";
import type { Condition, RuleStrategy, Session, Timeframe, Value } from "./types";

// Compiles a RuleStrategy into a complete MQL5 Expert Advisor. The emitted
// code implements the semantics in types.ts; interpret.ts is the reference
// implementation it is differentially tested against (scripts/mt5).
//
// Every node becomes a function (V<id>(k) for values, C<id>(k) for
// conditions) taking the decision offset k. Tunable numbers become MT5 inputs
// so traders can adjust and optimize them in MetaTrader.

export interface CompileMeta {
  name: string;
  id: string;
  updatedAt?: number;
}

const SESSION_TEST: Record<Session, string> = {
  london: "h >= 8 && h < 17",
  new_york: "h >= 13 && h < 22",
  asia: "h >= 23 || h < 8",
  london_ny_overlap: "h >= 13 && h < 17",
};

const MA_METHOD = { sma: "MODE_SMA", ema: "MODE_EMA", smma: "MODE_SMMA", lwma: "MODE_LWMA" } as const;
const APPLIED = {
  open: "PRICE_OPEN",
  high: "PRICE_HIGH",
  low: "PRICE_LOW",
  close: "PRICE_CLOSE",
  median: "PRICE_MEDIAN",
  typical: "PRICE_TYPICAL",
  weighted: "PRICE_WEIGHTED",
} as const;
/** Field codes understood by StratoPrice() in the emitted scaffold. */
const FIELD_CODE = { open: 0, high: 1, low: 2, close: 3, median: 4, typical: 5, weighted: 6 } as const;
const SESSION_CODE: Record<Session, number> = { london: 0, new_york: 1, asia: 2, london_ny_overlap: 3 };

type IndicatorValue = Extract<
  Value,
  {
    kind:
      | "ma"
      | "rsi"
      | "atr"
      | "macd"
      | "bands"
      | "stochastic"
      | "cci"
      | "adx"
      | "momentum"
      | "wpr"
      | "envelopes"
      | "stddev"
      | "demarker";
  }
>;

function tfExpr(tf: Timeframe | undefined): string {
  return tf ? `PERIOD_${tf}` : "InpTimeframe";
}

function tfLabel(tf: Timeframe | undefined): string {
  return tf ? ` (${tf})` : "";
}

export function compileRules(s: RuleStrategy, meta: CompileMeta): string {
  const table = buildNodeTable(s);
  const inputs: string[] = [];
  const handleInits: string[] = [];
  const handleIds = new Map<string, number>();
  const fns: string[] = [];

  const input = (type: "int" | "double", name: string, value: number, comment: string) => {
    const literal = type === "int" ? String(Math.round(value)) : String(value);
    inputs.push(`input ${type} ${name} = ${literal}; // ${comment}`);
    return name;
  };

  // One indicator handle (and one set of inputs) per distinct indicator config,
  // shared by every node that reads it at any shift or line.
  function handle(v: IndicatorValue): string {
    const key = stableKey({ ...v, shift: undefined, line: undefined });
    const existing = handleIds.get(key);
    if (existing !== undefined) return `H${existing}`;
    const n = handleIds.size;
    handleIds.set(key, n);
    const tf = tfExpr(v.tf);
    let init: string;
    switch (v.kind) {
      case "ma": {
        const p = input("int", `Ma${n}_Period`, v.period, `${v.method.toUpperCase()} period${tfLabel(v.tf)}`);
        init = `iMA(_Symbol, ${tf}, ${p}, 0, ${MA_METHOD[v.method]}, ${APPLIED[v.field ?? "close"]})`;
        break;
      }
      case "rsi": {
        const p = input("int", `Rsi${n}_Period`, v.period, `RSI period${tfLabel(v.tf)}`);
        init = `iRSI(_Symbol, ${tf}, ${p}, PRICE_CLOSE)`;
        break;
      }
      case "atr": {
        const p = input("int", `Atr${n}_Period`, v.period, `ATR period${tfLabel(v.tf)}`);
        init = `iATR(_Symbol, ${tf}, ${p})`;
        break;
      }
      case "macd": {
        const f = input("int", `Macd${n}_Fast`, v.fast, `MACD fast EMA${tfLabel(v.tf)}`);
        const sl = input("int", `Macd${n}_Slow`, v.slow, `MACD slow EMA${tfLabel(v.tf)}`);
        const sg = input("int", `Macd${n}_Signal`, v.signal, `MACD signal SMA${tfLabel(v.tf)}`);
        init = `iMACD(_Symbol, ${tf}, ${f}, ${sl}, ${sg}, PRICE_CLOSE)`;
        break;
      }
      case "bands": {
        const p = input("int", `Bands${n}_Period`, v.period, `Bollinger period${tfLabel(v.tf)}`);
        const d = input("double", `Bands${n}_Deviation`, v.deviation, `Bollinger deviations${tfLabel(v.tf)}`);
        init = `iBands(_Symbol, ${tf}, ${p}, 0, ${d}, PRICE_CLOSE)`;
        break;
      }
      case "stochastic": {
        const kp = input("int", `Stoch${n}_K`, v.k, `Stochastic %K period${tfLabel(v.tf)}`);
        const dp = input("int", `Stoch${n}_D`, v.d, `Stochastic %D period${tfLabel(v.tf)}`);
        const sl = input("int", `Stoch${n}_Slowing`, v.slowing, `Stochastic slowing${tfLabel(v.tf)}`);
        init = `iStochastic(_Symbol, ${tf}, ${kp}, ${dp}, ${sl}, MODE_SMA, STO_LOWHIGH)`;
        break;
      }
      case "cci": {
        const p = input("int", `Cci${n}_Period`, v.period, `CCI period${tfLabel(v.tf)}`);
        init = `iCCI(_Symbol, ${tf}, ${p}, ${APPLIED[v.field ?? "typical"]})`;
        break;
      }
      case "adx": {
        const p = input("int", `Adx${n}_Period`, v.period, `ADX period${tfLabel(v.tf)}`);
        init = `iADX(_Symbol, ${tf}, ${p})`;
        break;
      }
      case "momentum": {
        const p = input("int", `Mom${n}_Period`, v.period, `Momentum period${tfLabel(v.tf)}`);
        init = `iMomentum(_Symbol, ${tf}, ${p}, ${APPLIED[v.field ?? "close"]})`;
        break;
      }
      case "wpr": {
        const p = input("int", `Wpr${n}_Period`, v.period, `Williams %R period${tfLabel(v.tf)}`);
        init = `iWPR(_Symbol, ${tf}, ${p})`;
        break;
      }
      case "envelopes": {
        const p = input("int", `Env${n}_Period`, v.period, `Envelopes MA period${tfLabel(v.tf)}`);
        const d = input("double", `Env${n}_Deviation`, v.deviation, `Envelopes deviation %${tfLabel(v.tf)}`);
        init = `iEnvelopes(_Symbol, ${tf}, ${p}, 0, ${MA_METHOD[v.method]}, ${APPLIED[v.field ?? "close"]}, ${d})`;
        break;
      }
      case "stddev": {
        const p = input("int", `StdDev${n}_Period`, v.period, `Standard deviation period${tfLabel(v.tf)}`);
        init = `iStdDev(_Symbol, ${tf}, ${p}, 0, MODE_SMA, ${APPLIED[v.field ?? "close"]})`;
        break;
      }
      case "demarker": {
        const p = input("int", `DeM${n}_Period`, v.period, `DeMarker period${tfLabel(v.tf)}`);
        init = `iDeMarker(_Symbol, ${tf}, ${p})`;
        break;
      }
    }
    handleInits.push(`   H${n} = ${init};\n   if (H${n} == INVALID_HANDLE) return(INIT_FAILED);`);
    return `H${n}`;
  }

  const V = (v: Value) => `V${table.valueId(v)}`;
  const C = (c: Condition) => `C${table.conditionId(c)}`;
  const bufferOf = (v: Value): number => {
    if (v.kind === "macd") return v.line === "main" ? 0 : 1;
    if (v.kind === "bands") return { middle: 0, upper: 1, lower: 2 }[v.line];
    if (v.kind === "stochastic") return v.line === "main" ? 0 : 1;
    if (v.kind === "adx") return { adx: 0, plus_di: 1, minus_di: 2 }[v.line];
    if (v.kind === "envelopes") return v.line === "upper" ? 0 : 1;
    return 0;
  };

  table.values.forEach((v, id) => {
    let body: string;
    switch (v.kind) {
      case "const":
        body = `return ${input("double", `Level${id}`, v.value, "Level")};`;
        break;
      case "pips":
        body = `return ${input("double", `Pips${id}`, v.value, "Distance (pips)")} * StratoPip();`;
        break;
      case "arith": {
        const op = { add: "+", sub: "-", mul: "*", div: "/" }[v.op];
        body = `double a = ${V(v.a)}(k), b = ${V(v.b)}(k);
   if (!StratoOk(a) || !StratoOk(b)${v.op === "div" ? " || b == 0" : ""}) return EMPTY_VALUE;
   return a ${op} b;`;
        break;
      }
      case "vwap":
        body = `int i = StratoIdx(InpTimeframe, k);
   return i < 0 ? EMPTY_VALUE : StratoVWAP(i + ${v.shift ?? 0});`;
        break;
      case "price":
        body = `int i = StratoIdx(${tfExpr(v.tf)}, k);
   return i < 0 ? EMPTY_VALUE : StratoPrice(${tfExpr(v.tf)}, i + ${v.shift ?? 0}, ${FIELD_CODE[v.field]});`;
        break;
      case "candle": {
        const expr = {
          body: "MathAbs(c - o)",
          range: "h - l",
          upper_wick: "h - MathMax(o, c)",
          lower_wick: "MathMin(o, c) - l",
        }[v.measure];
        body = `int i = StratoIdx(${tfExpr(v.tf)}, k);
   if (i < 0) return EMPTY_VALUE;
   i += ${v.shift ?? 0};
   double o = iOpen(_Symbol, ${tfExpr(v.tf)}, i), h = iHigh(_Symbol, ${tfExpr(v.tf)}, i);
   double l = iLow(_Symbol, ${tfExpr(v.tf)}, i), c = iClose(_Symbol, ${tfExpr(v.tf)}, i);
   if (o <= 0) return EMPTY_VALUE;
   return ${expr};`;
        break;
      }
      case "swing": {
        const strength = input("int", `Swing${id}_Strength`, v.strength, `Swing ${v.side}: bars on each side${tfLabel(v.tf)}`);
        const lookback = input("int", `Swing${id}_Lookback`, v.lookback, `Swing ${v.side}: search this many bars back${tfLabel(v.tf)}`);
        const read = v.side === "high" ? "iHigh" : "iLow";
        const beats = v.side === "high" ? "StratoGt" : "StratoLt";
        body = `int i = StratoIdx(${tfExpr(v.tf)}, k);
   if (i < 0) return EMPTY_VALUE;
   i += ${v.shift ?? 0};
   for (int p = i + ${strength}; p <= i + ${lookback}; p++) {
      double pivot = ${read}(_Symbol, ${tfExpr(v.tf)}, p);
      if (pivot <= 0 || ${read}(_Symbol, ${tfExpr(v.tf)}, p + ${strength}) <= 0) return EMPTY_VALUE;
      bool ok = true;
      for (int j = 1; j <= ${strength} && ok; j++)
         ok = ${beats}(pivot, ${read}(_Symbol, ${tfExpr(v.tf)}, p + j)) && ${beats}(pivot, ${read}(_Symbol, ${tfExpr(v.tf)}, p - j));
      if (ok) return pivot;
   }
   return EMPTY_VALUE;`;
        break;
      }
      case "sar": {
        const st = input("double", `Sar${id}_Step`, v.step, `Parabolic SAR step${tfLabel(v.tf)}`);
        const mx = input("double", `Sar${id}_Max`, v.max, `Parabolic SAR maximum${tfLabel(v.tf)}`);
        body = `int i = StratoIdx(${tfExpr(v.tf)}, k);
   return i < 0 ? EMPTY_VALUE : StratoSAR(${tfExpr(v.tf)}, i + ${v.shift ?? 0}, ${st}, ${mx});`;
        break;
      }
      case "session_range":
        body = `int i = StratoIdx(InpTimeframe, k);
   return i < 0 ? EMPTY_VALUE : StratoSessionRange(${SESSION_CODE[v.session]}, ${v.side === "high" ? "true" : "false"}, i + ${v.shift ?? 0});`;
        break;
      case "highest":
      case "lowest": {
        const bars = input("int", `Range${id}_Bars`, v.bars, `${v.kind === "highest" ? "Highest high" : "Lowest low"} lookback (bars)${tfLabel(v.tf)}`);
        const mode = v.kind === "highest" ? "MODE_HIGH" : "MODE_LOW";
        const read = v.kind === "highest" ? "iHigh" : "iLow";
        body = `int i = StratoIdx(${tfExpr(v.tf)}, k);
   if (i < 0) return EMPTY_VALUE;
   if (Bars(_Symbol, ${tfExpr(v.tf)}) < i + ${v.shift ?? 0} + ${bars}) return EMPTY_VALUE;
   int j = ${v.kind === "highest" ? "iHighest" : "iLowest"}(_Symbol, ${tfExpr(v.tf)}, ${mode}, ${bars}, i + ${v.shift ?? 0});
   return j < 0 ? EMPTY_VALUE : ${read}(_Symbol, ${tfExpr(v.tf)}, j);`;
        break;
      }
      default:
        body = `int i = StratoIdx(${tfExpr(v.tf)}, k);
   return i < 0 ? EMPTY_VALUE : StratoBuf(${handle(v)}, ${bufferOf(v)}, i + ${v.shift ?? 0});`;
    }
    fns.push(`double V${id}(int k) {\n   ${body}\n}`);
  });

  table.conditions.forEach((c, id) => {
    let body: string;
    switch (c.kind) {
      case "compare": {
        const fn = { gt: "StratoGt", lt: "StratoLt", gte: "StratoGte", lte: "StratoLte" }[c.op];
        body = `double a = ${V(c.a)}(k), b = ${V(c.b)}(k);
   return StratoOk(a) && StratoOk(b) && ${fn}(a, b);`;
        break;
      }
      case "cross": {
        const test =
          c.dir === "above" ? "StratoLte(a1, b1) && StratoGt(a0, b0)" : "StratoGte(a1, b1) && StratoLt(a0, b0)";
        body = `double a0 = ${V(c.a)}(k), b0 = ${V(c.b)}(k), a1 = ${V(c.a)}(k + 1), b1 = ${V(c.b)}(k + 1);
   if (!StratoOk(a0) || !StratoOk(b0) || !StratoOk(a1) || !StratoOk(b1)) return false;
   return ${test};`;
        break;
      }
      case "near": {
        const pips = input("double", `Near${id}_Pips`, c.pips, "Counts as touching within (pips)");
        body = `double a = ${V(c.a)}(k), b = ${V(c.b)}(k);
   return StratoOk(a) && StratoOk(b) && StratoLt(MathAbs(a - b), ${pips} * StratoPip());`;
        break;
      }
      case "session":
        body = `datetime t = iTime(_Symbol, InpTimeframe, k);
   if (t == 0) return false;
   int h = StratoGmtHour(t);
   return ${SESSION_TEST[c.name]};`;
        break;
      case "time_window": {
        const from = input("int", `Hours${id}_From`, c.fromHour, "Trading window start, GMT hour (0-23)");
        const to = input("int", `Hours${id}_To`, c.toHour, "Trading window end, GMT hour (exclusive)");
        body = `datetime t = iTime(_Symbol, InpTimeframe, k);
   if (t == 0) return false;
   int h = StratoGmtHour(t);
   return ${from} <= ${to} ? (h >= ${from} && h < ${to}) : (h >= ${from} || h < ${to});`;
        break;
      }
      case "weekday":
        body = `datetime t = iTime(_Symbol, InpTimeframe, k);
   if (t == 0) return false;
   MqlDateTime s;
   TimeToStruct(t - StratoGmtOffset() * 3600, s);
   return ${c.days.length ? c.days.map((d) => `s.day_of_week == ${d}`).join(" || ") : "false"};`;
        break;
      case "all":
        body = `return ${c.of.map((x) => `${C(x)}(k)`).join(" && ") || "true"};`;
        break;
      case "any":
        body = `return ${c.of.map((x) => `${C(x)}(k)`).join(" || ") || "false"};`;
        break;
      case "not":
        body = `return !${C(c.of)}(k);`;
        break;
      case "within": {
        const bars = input("int", `Within${id}_Bars`, c.bars, "Look back this many bars for the condition");
        body = `for (int j = 0; j < ${bars}; j++) if (${C(c.of)}(k + j)) return true;
   return false;`;
        break;
      }
      case "pattern":
        body = patternBody(c, id, input);
        break;
    }
    fns.push(`bool C${id}(int k) {\n   ${body}\n}`);
  });

  const conj = (ids: number[] | null, empty: string) =>
    ids === null ? "false" : ids.length ? ids.map((i) => `C${i}(0)`).join(" && ") : empty;
  const noDirection = s.directionFromInput === true && s.long === null && s.short === null;

  const x = s.exits;
  const title = (meta.name || "Untitled Strategy").replace(/[\x00-\x1f\x7f]/g, " ").slice(0, 60);
  const generated = meta.updatedAt && Number.isFinite(meta.updatedAt) ? new Date(meta.updatedAt).toISOString() : "";
  const tfDefault = s.timeframe === "chart" ? "PERIOD_CURRENT" : `PERIOD_${s.timeframe}`;
  const lots = s.sizing.fixedLots ?? 0.1;
  const maxLots = s.sizing.riskPercent && s.sizing.fixedLots ? s.sizing.fixedLots : 0;
  const news = s.guards.news === "high" ? "High impact" : s.guards.news === "all" ? "All" : "Off";

  return `//+------------------------------------------------------------------+
//| StratoBot AI - Generated Expert Advisor
//| Strategy: ${title}
//| Generated: ${generated}
//|
//| Rules are checked once per bar, on closed bars only.
//| Review this EA and run it on a demo account before trading real money.
//+------------------------------------------------------------------+
#property copyright "StratoBot AI"
#property link "https://www.stratobot.trade"
#property version "2.00"

#include <Trade\\Trade.mqh>

input ENUM_TIMEFRAMES InpTimeframe = ${tfDefault}; // Timeframe the rules run on
input long   InpMagic = ${magicNumber(meta.id)}; // Magic number (identifies this EA's trades)
input double InpLots = ${lots}; // Lot size${s.sizing.riskPercent ? " (used when risk sizing can't apply)" : ""}
input double InpRiskPercent = ${s.sizing.riskPercent ?? 0}; // Risk per trade, % of balance (0 = off; needs a stop loss)
input double InpMaxLots = ${maxLots}; // Largest lot size risk sizing may use (0 = no cap)
input double InpStopLossPips = ${x.stopLossPips ?? 0}; // Stop loss, pips (0 = none)
input double InpTakeProfitPips = ${x.takeProfitPips ?? 0}; // Take profit, pips (0 = none)
input double InpTrailingPips = ${x.trailingPips ?? 0}; // Trailing stop distance, pips (0 = off)
input double InpBreakEvenPips = ${x.breakEvenPips ?? 0}; // Move stop to entry after this profit, pips (0 = off)
input double InpMinRewardRisk = ${s.guards.minRewardRisk ?? 0}; // Minimum take-profit / stop-loss ratio (0 = off)
input double InpMaxDailyLossPercent = ${s.guards.maxDailyLossPercent ?? 0}; // Stop new trades after losing this % today (0 = off)
input string InpNewsFilter = "${news}"; // Pause around news: Off, High impact, All
${noDirection ? `input string InpNoSignalDirection = "Skip"; // If no rule picks a direction: Skip, Buy, Sell\n` : ""}input bool   InpAutoGmtOffset = true; // Detect the broker's GMT offset automatically (live trading only)
input int    InpServerGmtOffsetHours = 2; // Broker server time minus GMT, hours (Strategy Tester, or when auto is off)
input bool   InpDiffLog = false; // Developer diagnostics: log every rule value each bar

${inputs.join("\n")}

CTrade trade;
datetime g_lastBar = 0;
datetime g_lastWarnBar = 0;
int g_log = INVALID_HANDLE;
${[...handleIds.values()].map((n) => `int H${n} = INVALID_HANDLE;`).join("\n")}

//+------------------------------------------------------------------+
//| Helpers                                                          |
//+------------------------------------------------------------------+
double StratoPip() {
   return (_Digits == 3 || _Digits == 5) ? _Point * 10.0 : _Point;
}

bool StratoOk(double v) {
   return v != EMPTY_VALUE && MathIsValidNumber(v);
}

// Values within a relative 1e-9 count as equal, so exact ties (common with
// decimal prices) are decided by the rule rather than by rounding noise.
bool StratoGt(double a, double b) {
   return a - b > 1e-9 * MathMax(1.0, MathMax(MathAbs(a), MathAbs(b)));
}
bool StratoLt(double a, double b) { return StratoGt(b, a); }
bool StratoGte(double a, double b) { return !StratoLt(a, b); }
bool StratoLte(double a, double b) { return !StratoGt(a, b); }

// Newest-first index of the most recently closed bar of tf, as of the decision k bars ago.
int StratoIdx(ENUM_TIMEFRAMES tf, int k) {
   datetime t = iTime(_Symbol, InpTimeframe, k);
   if (t == 0) return -1;
   int j = iBarShift(_Symbol, tf, t, false);
   return j < 0 ? -1 : j + 1;
}

double StratoBuf(int handle, int buffer, int index) {
   if (handle == INVALID_HANDLE || index < 0) return EMPTY_VALUE;
   double b[];
   if (CopyBuffer(handle, buffer, index, 1, b) != 1) return EMPTY_VALUE;
   return b[0];
}

int StratoGmtOffset() {
   if (!InpAutoGmtOffset || MQLInfoInteger(MQL_TESTER)) return InpServerGmtOffsetHours;
   return (int)MathRound((double)(TimeTradeServer() - TimeGMT()) / 3600.0);
}

int StratoGmtHour(datetime serverTime) {
   MqlDateTime s;
   TimeToStruct(serverTime - StratoGmtOffset() * 3600, s);
   return s.hour;
}

// Field codes: 0 open, 1 high, 2 low, 3 close, 4 median (H+L)/2, 5 typical (H+L+C)/3, 6 weighted (H+L+2C)/4.
double StratoPrice(ENUM_TIMEFRAMES tf, int i, int field) {
   double o = iOpen(_Symbol, tf, i), h = iHigh(_Symbol, tf, i), l = iLow(_Symbol, tf, i), c = iClose(_Symbol, tf, i);
   if (o <= 0) return EMPTY_VALUE;
   switch (field) {
      case 0: return o;
      case 1: return h;
      case 2: return l;
      case 3: return c;
      case 4: return (h + l) / 2;
      case 5: return (h + l + c) / 3;
      default: return (h + l + 2 * c) / 4;
   }
}

// Parabolic SAR of closed bar idx, computed from the ${SAR_WINDOW} closed bars ending there.
// Deliberately not iSAR: the built-in re-runs its state machine on every tick of
// the forming bar, so its values depend on the intrabar tick path.
double StratoSAR(ENUM_TIMEFRAMES tf, int idx, double step, double maximum) {
   const int W = ${SAR_WINDOW};
   double hi[], lo[];
   if (idx < 0 || CopyHigh(_Symbol, tf, idx, W, hi) != W || CopyLow(_Symbol, tf, idx, W, lo) != W) return EMPTY_VALUE;
   double sar[], af[], ep[];
   ArrayResize(sar, W);
   ArrayResize(af, W);
   ArrayResize(ep, W);
   ArrayInitialize(sar, EMPTY_VALUE);
   ArrayInitialize(af, 0);
   ArrayInitialize(ep, 0);
   bool isLong = false;
   int lastRev = 0;
   sar[0] = hi[0];
   af[0] = step;
   ep[0] = lo[0];
   for (int i = 1; i < W; i++) {
      if (sar[i] == EMPTY_VALUE) sar[i] = sar[i - 1];
      if (isLong && sar[i] > lo[i]) {
         isLong = false;
         sar[i] = hi[ArrayMaximum(hi, lastRev, i - lastRev)];
         ep[i] = lo[i];
         lastRev = i;
         af[i] = step;
      } else if (!isLong && sar[i] < hi[i]) {
         isLong = true;
         sar[i] = lo[ArrayMinimum(lo, lastRev, i - lastRev)];
         ep[i] = hi[i];
         lastRev = i;
         af[i] = step;
      }
      if (isLong) {
         if (hi[i] > ep[i - 1] && i != lastRev) { ep[i] = hi[i]; af[i] = MathMin(af[i - 1] + step, maximum); }
         else if (i != lastRev) { af[i] = af[i - 1]; ep[i] = ep[i - 1]; }
         if (i + 1 < W) {
            sar[i + 1] = sar[i] + af[i] * (ep[i] - sar[i]);
            if (sar[i + 1] > lo[i] || sar[i + 1] > lo[i - 1]) sar[i + 1] = MathMin(lo[i], lo[i - 1]);
         }
      } else {
         if (lo[i] < ep[i - 1] && i != lastRev) { ep[i] = lo[i]; af[i] = MathMin(af[i - 1] + step, maximum); }
         else if (i != lastRev) { af[i] = af[i - 1]; ep[i] = ep[i - 1]; }
         if (i + 1 < W) {
            sar[i + 1] = sar[i] + af[i] * (ep[i] - sar[i]);
            if (sar[i + 1] < hi[i] || sar[i + 1] < hi[i - 1]) sar[i + 1] = MathMax(hi[i], hi[i - 1]);
         }
      }
   }
   return sar[W - 1];
}

// Session codes: 0 London, 1 New York, 2 Asia, 3 London/NY overlap (GMT hours).
bool StratoSessionOn(int session, int h) {
   switch (session) {
      case 0: return ${SESSION_TEST.london};
      case 1: return ${SESSION_TEST.new_york};
      case 2: return ${SESSION_TEST.asia};
      default: return ${SESSION_TEST.london_ny_overlap};
   }
}

// High/low of the most recent run of bars inside the session, scanning back from bar i.
double StratoSessionRange(int session, bool high, int i) {
   bool found = false;
   double best = high ? -DBL_MAX : DBL_MAX;
   for (int j = i; j < i + 1000; j++) {
      datetime t = iTime(_Symbol, InpTimeframe, j);
      if (t == 0) break;
      if (StratoSessionOn(session, StratoGmtHour(t))) {
         found = true;
         best = high ? MathMax(best, iHigh(_Symbol, InpTimeframe, j)) : MathMin(best, iLow(_Symbol, InpTimeframe, j));
      } else if (found) break;
   }
   return found ? best : EMPTY_VALUE;
}

// Tick-volume-weighted average price from the start of bar i's trading day through bar i.
double StratoVWAP(int i) {
   datetime barTime = iTime(_Symbol, InpTimeframe, i);
   if (barTime == 0) return EMPTY_VALUE;
   datetime dayStart = iTime(_Symbol, PERIOD_D1, iBarShift(_Symbol, PERIOD_D1, barTime, false));
   double pv = 0, vol = 0;
   for (int j = i; j < i + 1000; j++) {
      datetime t = iTime(_Symbol, InpTimeframe, j);
      if (t == 0 || t < dayStart) break;
      double v = (double)iTickVolume(_Symbol, InpTimeframe, j);
      pv += (iHigh(_Symbol, InpTimeframe, j) + iLow(_Symbol, InpTimeframe, j) + iClose(_Symbol, InpTimeframe, j)) / 3.0 * v;
      vol += v;
   }
   return vol > 0 ? pv / vol : EMPTY_VALUE;
}

void StratoWarn(string message) {
   datetime bar = iTime(_Symbol, InpTimeframe, 0);
   if (bar == g_lastWarnBar) return;
   g_lastWarnBar = bar;
   Print("StratoBot: ", message);
}

bool IsOwnPosition() {
   return PositionGetString(POSITION_SYMBOL) == _Symbol && PositionGetInteger(POSITION_MAGIC) == InpMagic;
}

int CountOwnPositions() {
   int count = 0;
   for (int i = PositionsTotal() - 1; i >= 0; i--) {
      ulong ticket = PositionGetTicket(i);
      if (ticket > 0 && PositionSelectByTicket(ticket) && IsOwnPosition()) count++;
   }
   return count;
}

//+------------------------------------------------------------------+
//| Strategy rules                                                   |
//+------------------------------------------------------------------+
${fns.join("\n\n")}

bool StratoFilters() {
   return ${conj(table.filters, "true")};
}

bool StratoLong() {
   return ${conj(table.long, "true")};
}

bool StratoShort() {
   return ${conj(table.short, "true")};
}

//+------------------------------------------------------------------+
//| Guards                                                           |
//+------------------------------------------------------------------+
bool StratoDailyLossOk() {
   if (InpMaxDailyLossPercent <= 0) return true;
   MqlDateTime t;
   TimeToStruct(TimeCurrent(), t);
   t.hour = 0;
   t.min = 0;
   t.sec = 0;
   if (!HistorySelect(StructToTime(t), TimeCurrent())) return true;
   double realized = 0;
   for (int i = HistoryDealsTotal() - 1; i >= 0; i--) {
      ulong deal = HistoryDealGetTicket(i);
      if (deal == 0) continue;
      long dealType = HistoryDealGetInteger(deal, DEAL_TYPE);
      if (dealType != DEAL_TYPE_BUY && dealType != DEAL_TYPE_SELL) continue;
      realized += HistoryDealGetDouble(deal, DEAL_PROFIT) + HistoryDealGetDouble(deal, DEAL_SWAP) +
                  HistoryDealGetDouble(deal, DEAL_COMMISSION);
   }
   double startBalance = AccountInfoDouble(ACCOUNT_BALANCE) - realized;
   if (startBalance <= 0) return true;
   if (realized + AccountInfoDouble(ACCOUNT_PROFIT) <= -startBalance * InpMaxDailyLossPercent / 100.0) {
      StratoWarn("Max daily loss reached: no new trades until tomorrow (server time)");
      return false;
   }
   return true;
}

// No new trades from 30 minutes before to 30 minutes after a calendar event for
// either currency. MetaTrader's calendar doesn't exist in the Strategy Tester.
bool StratoNewsOk() {
   if (InpNewsFilter == "Off" || MQLInfoInteger(MQL_TESTER)) return true;
   bool highOnly = (InpNewsFilter == "High impact");
   datetime now = TimeTradeServer();
   string currencies[2];
   currencies[0] = SymbolInfoString(_Symbol, SYMBOL_CURRENCY_BASE);
   currencies[1] = SymbolInfoString(_Symbol, SYMBOL_CURRENCY_PROFIT);
   for (int c = 0; c < 2; c++) {
      if (currencies[c] == "") continue;
      MqlCalendarValue values[];
      if (CalendarValueHistory(values, now - 1800, now + 1800, NULL, currencies[c]) <= 0) continue;
      for (int i = 0; i < ArraySize(values); i++) {
         MqlCalendarEvent ev;
         if (!CalendarEventById(values[i].event_id, ev)) continue;
         if (ev.importance == CALENDAR_IMPORTANCE_NONE) continue;
         if (highOnly && ev.importance != CALENDAR_IMPORTANCE_HIGH) continue;
         StratoWarn("News filter paused trading around: " + ev.name + " (" + currencies[c] + ")");
         return false;
      }
   }
   return true;
}

bool StratoRewardRiskOk() {
   if (InpMinRewardRisk <= 0 || InpStopLossPips <= 0 || InpTakeProfitPips <= 0) return true;
   if (InpTakeProfitPips / InpStopLossPips + 1e-9 < InpMinRewardRisk) {
      StratoWarn("take profit / stop loss is below the minimum reward:risk, so no trade was opened");
      return false;
   }
   return true;
}

//+------------------------------------------------------------------+
//| Orders and exits                                                 |
//+------------------------------------------------------------------+
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
   double lots = InpLots;
   double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double tickSize = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   double stopDistance = InpStopLossPips * StratoPip();
   if (InpRiskPercent > 0 && stopDistance > 0 && tickValue > 0 && tickSize > 0) {
      double riskMoney = AccountInfoDouble(ACCOUNT_BALANCE) * InpRiskPercent / 100.0;
      lots = riskMoney / ((stopDistance / tickSize) * tickValue);
      if (InpMaxLots > 0) lots = MathMin(lots, InpMaxLots);
   }
   return NormalizeLots(lots);
}

void OpenPosition(int dir) {
   double lots = StratoLots();
   if (lots <= 0) {
      StratoWarn("calculated lot size is below this symbol's minimum, so no trade was opened");
      return;
   }
   double price = dir > 0 ? SymbolInfoDouble(_Symbol, SYMBOL_ASK) : SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double sl = InpStopLossPips > 0 ? NormalizeDouble(price - dir * InpStopLossPips * StratoPip(), _Digits) : 0;
   double tp = InpTakeProfitPips > 0 ? NormalizeDouble(price + dir * InpTakeProfitPips * StratoPip(), _Digits) : 0;
   bool sent = dir > 0 ? trade.Buy(lots, _Symbol, 0, sl, tp, "StratoBot")
                       : trade.Sell(lots, _Symbol, 0, sl, tp, "StratoBot");
   if (!sent || (trade.ResultRetcode() != TRADE_RETCODE_DONE && trade.ResultRetcode() != TRADE_RETCODE_PLACED)) {
      StratoWarn("order was rejected: " + trade.ResultRetcodeDescription());
   }
}

void ManageExits() {
   double pip = StratoPip();
   for (int i = PositionsTotal() - 1; i >= 0; i--) {
      ulong ticket = PositionGetTicket(i);
      if (ticket == 0 || !PositionSelectByTicket(ticket) || !IsOwnPosition()) continue;
      bool isBuy = PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY;
      double dir = isBuy ? 1.0 : -1.0;
      double openPrice = PositionGetDouble(POSITION_PRICE_OPEN);
      double sl = PositionGetDouble(POSITION_SL);
      double tp = PositionGetDouble(POSITION_TP);
      double market = isBuy ? SymbolInfoDouble(_Symbol, SYMBOL_BID) : SymbolInfoDouble(_Symbol, SYMBOL_ASK);
      double newSL = sl;
      double newTP = tp;

      // Re-apply a missing stop / target (e.g. if the broker dropped it).
      if (newSL == 0 && InpStopLossPips > 0) newSL = openPrice - dir * InpStopLossPips * pip;
      if (newTP == 0 && InpTakeProfitPips > 0) newTP = openPrice + dir * InpTakeProfitPips * pip;

      if (InpBreakEvenPips > 0 && dir * (market - openPrice) >= InpBreakEvenPips * pip &&
          (newSL == 0 || dir * (openPrice - newSL) > 0)) newSL = openPrice;

      // Trail only in the position's favour, a pip at a time, so the broker isn't sent a modify every tick.
      if (InpTrailingPips > 0) {
         double trail = market - dir * InpTrailingPips * pip;
         if (newSL == 0 || dir * (trail - newSL) >= pip) newSL = trail;
      }

      newSL = NormalizeDouble(newSL, _Digits);
      newTP = NormalizeDouble(newTP, _Digits);
      if (newSL != NormalizeDouble(sl, _Digits) || newTP != NormalizeDouble(tp, _Digits)) {
         trade.PositionModify(ticket, newSL, newTP);
      }
   }
}

//+------------------------------------------------------------------+
//| Developer diagnostics (InpDiffLog): every node's value, each bar |
//+------------------------------------------------------------------+
string StratoNum(double v) {
   return StratoOk(v) ? DoubleToString(v, 10) : "nan";
}

void StratoLogDecision(bool filters, bool goLong, bool goShort) {
   if (g_log == INVALID_HANDLE) return;
   string line = IntegerToString((long)iTime(_Symbol, InpTimeframe, 0)) + "," + (filters ? "1" : "0") + "," +
                 (goLong ? "1" : "0") + "," + (goShort ? "1" : "0");
${table.values.map((_, i) => `   line += "," + StratoNum(V${i}(0));`).join("\n")}
${table.conditions.map((_, i) => `   line += "," + (C${i}(0) ? "1" : "0");`).join("\n")}
   FileWriteString(g_log, line + "\\n");
}

void StratoDumpRates() {
   MqlRates r[];
   int n = CopyRates(_Symbol, InpTimeframe, 0, 100000, r);
   int f = FileOpen("StratoBotDiff\\\\rates.csv", FILE_WRITE | FILE_TXT | FILE_ANSI | FILE_COMMON);
   if (f == INVALID_HANDLE) return;
   for (int i = 0; i < n; i++) {
      // 16 decimals round-trips the exact doubles MT5 holds, so both sides compute from identical inputs.
      FileWriteString(f, IntegerToString((long)r[i].time) + "," + DoubleToString(r[i].open, 16) + "," +
                         DoubleToString(r[i].high, 16) + "," + DoubleToString(r[i].low, 16) + "," +
                         DoubleToString(r[i].close, 16) + "," + IntegerToString(r[i].tick_volume) + "\\n");
   }
   FileClose(f);
}

//+------------------------------------------------------------------+
//| Expert lifecycle                                                 |
//+------------------------------------------------------------------+
int OnInit() {
   trade.SetExpertMagicNumber(InpMagic);
   trade.SetDeviationInPoints(10);
   trade.SetTypeFillingBySymbol(_Symbol);
${handleInits.join("\n")}
   if (InpRiskPercent > 0 && InpStopLossPips <= 0) Print("StratoBot: risk-based sizing needs a stop loss; using the fixed lot size instead.");
   if (InpMinRewardRisk > 0 && (InpStopLossPips <= 0 || InpTakeProfitPips <= 0)) Print("StratoBot: the reward:risk rule needs both a stop loss and a take profit, so it has no effect.");
   if (InpNewsFilter != "Off" && MQLInfoInteger(MQL_TESTER)) Print("StratoBot: the news filter uses MetaTrader's live calendar, which doesn't exist in the Strategy Tester, so it is skipped here.");
   if (InpDiffLog) {
      g_log = FileOpen("StratoBotDiff\\\\nodes.csv", FILE_WRITE | FILE_TXT | FILE_ANSI | FILE_COMMON);
      FileWriteString(g_log, "#meta," + _Symbol + "," + IntegerToString(_Digits) + "," + DoubleToString(_Point, 10) + "," +
                             IntegerToString(StratoGmtOffset()) + ",${table.values.length},${table.conditions.length}\\n");
   }
   g_lastBar = iTime(_Symbol, InpTimeframe, 0); // first decision at the next bar open, never mid-bar
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason) {
   if (g_log != INVALID_HANDLE) {
      FileClose(g_log);
      StratoDumpRates();
   }
}

void OnTick() {
   if (CountOwnPositions() > 0) ManageExits();

   datetime bar = iTime(_Symbol, InpTimeframe, 0);
   if (bar == 0 || bar == g_lastBar) return;
   g_lastBar = bar;

   bool filters = StratoFilters();
   bool goLong = filters && StratoLong();
   bool goShort = filters && StratoShort();
   if (InpDiffLog) StratoLogDecision(filters, goLong, goShort);

   if (CountOwnPositions() > 0) return;
   int dir = 0;
   if (goLong && goShort) {
      StratoWarn("buy and sell rules both matched on this bar, so no trade was opened");
      return;
   }
   if (goLong) dir = 1;
   else if (goShort) dir = -1;
${
  noDirection
    ? `   else if (filters) {
      if (InpNoSignalDirection == "Buy") dir = 1;
      else if (InpNoSignalDirection == "Sell") dir = -1;
      else StratoWarn("conditions met, but no rule picks buy or sell; set 'If no rule picks a direction' to trade");
   }
`
    : ""
}   if (dir == 0) return;
   if (!StratoDailyLossOk() || !StratoNewsOk() || !StratoRewardRiskOk()) return;
   OpenPosition(dir);
}
`;
}

function patternBody(
  c: Extract<Condition, { kind: "pattern" }>,
  id: number,
  input: (type: "int" | "double", name: string, value: number, comment: string) => string
): string {
  const tf = tfExpr(c.tf);
  const head = `int i = StratoIdx(${tf}, k);
   if (i < 0) return false;
   i += ${c.shift ?? 0};
   double o = iOpen(_Symbol, ${tf}, i), c = iClose(_Symbol, ${tf}, i);
   double h = iHigh(_Symbol, ${tf}, i), l = iLow(_Symbol, ${tf}, i);
   if (o <= 0) return false;`;
  const bullish = "side" in c && c.side === "bullish";
  switch (c.pattern) {
    case "engulfing":
      return `${head}
   double po = iOpen(_Symbol, ${tf}, i + 1), pc = iClose(_Symbol, ${tf}, i + 1);
   if (po <= 0) return false;
   return ${
     bullish
       ? "StratoLt(pc, po) && StratoGt(c, o) && StratoLte(o, pc) && StratoGte(c, po)"
       : "StratoGt(pc, po) && StratoLt(c, o) && StratoGte(o, pc) && StratoLte(c, po)"
   };`;
    case "pin_bar":
      return `${head}
   double range = h - l;
   if (!StratoGt(range, 0)) return false;
   double upper = h - MathMax(o, c), lower = MathMin(o, c) - l;
   if (!(StratoLt(MathAbs(c - o), range * 0.33) && (StratoGt(upper, range * 0.6) || StratoGt(lower, range * 0.6)))) return false;
   return ${bullish ? "StratoGt(lower, upper) && StratoGt(c, o)" : "StratoGt(upper, lower) && StratoLt(c, o)"};`;
    case "fvg": {
      const min = input("double", `Fvg${id}_MinPips`, c.minPips, "Minimum fair value gap (pips)");
      return `${head}
   double oldHigh = iHigh(_Symbol, ${tf}, i + 2), oldLow = iLow(_Symbol, ${tf}, i + 2);
   if (oldHigh <= 0) return false;
   return StratoGte(${bullish ? "l - oldHigh" : "oldLow - h"}, ${min} * StratoPip());`;
    }
    case "inside_bar":
    case "outside_bar": {
      const test =
        c.pattern === "inside_bar" ? "StratoLt(h, ph) && StratoGt(l, pl)" : "StratoGt(h, ph) && StratoLt(l, pl)";
      return `${head}
   double ph = iHigh(_Symbol, ${tf}, i + 1), pl = iLow(_Symbol, ${tf}, i + 1);
   if (ph <= 0) return false;
   return ${test};`;
    }
    case "doji":
      return `${head}
   double range = h - l;
   return StratoGt(range, 0) && StratoLte(MathAbs(c - o), range * 0.1);`;
    case "three_in_row": {
      const dir = (open: string, close: string) => (bullish ? `StratoGt(${close}, ${open})` : `StratoLt(${close}, ${open})`);
      const beyond = (a: string, b: string) => (bullish ? `StratoGt(${a}, ${b})` : `StratoLt(${a}, ${b})`);
      return `${head}
   double o1 = iOpen(_Symbol, ${tf}, i + 1), c1 = iClose(_Symbol, ${tf}, i + 1);
   double o2 = iOpen(_Symbol, ${tf}, i + 2), c2 = iClose(_Symbol, ${tf}, i + 2);
   if (o1 <= 0 || o2 <= 0) return false;
   return ${dir("o", "c")} && ${dir("o1", "c1")} && ${dir("o2", "c2")} && ${beyond("c", "c1")} && ${beyond("c1", "c2")};`;
    }
    case "star":
      return `${head}
   double om = iOpen(_Symbol, ${tf}, i + 1), cm = iClose(_Symbol, ${tf}, i + 1);
   double of = iOpen(_Symbol, ${tf}, i + 2), cf = iClose(_Symbol, ${tf}, i + 2);
   if (om <= 0 || of <= 0) return false;
   bool smallMiddle = StratoLt(MathAbs(cm - om), MathAbs(cf - of) * 0.3);
   double midpoint = (of + cf) / 2;
   return ${
     bullish
       ? "StratoLt(cf, of) && smallMiddle && StratoGt(c, o) && StratoGt(c, midpoint)"
       : "StratoGt(cf, of) && smallMiddle && StratoLt(c, o) && StratoLt(c, midpoint)"
   };`;
    case "order_block": {
      const lookback = input("int", `Ob${id}_Lookback`, c.lookback, "Order block lookback (bars)");
      return `${head}
   for (int j = i + 1; j <= i + ${lookback}; j++) {
      double io = iOpen(_Symbol, ${tf}, j), ic = iClose(_Symbol, ${tf}, j);
      double bo = iOpen(_Symbol, ${tf}, j + 1), bc = iClose(_Symbol, ${tf}, j + 1);
      if (io <= 0 || bo <= 0) return false;
      if (StratoGt(MathAbs(ic - io), MathAbs(bc - bo) * 1.5)) {
         if (StratoLt(c, iLow(_Symbol, ${tf}, j + 1)) || StratoGt(c, iHigh(_Symbol, ${tf}, j + 1))) return false;
         return ${bullish ? "StratoGt(ic, io)" : "!StratoGt(ic, io)"};
      }
   }
   return false;`;
    }
  }
}

/** Stable per-strategy magic number, so two StratoBot EAs on one account don't manage each other's trades. */
function magicNumber(id: string): number {
  let h = 0;
  for (const ch of id ?? "") h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return 100000 + (h % 900000);
}
