import type { RuleStrategy } from "./rules/types";

// Core domain types for the StratoBot AI trader-facing app.
// These model the "Blueprint" concept from Engineering Plan v1.2 §1:
// trader language -> schema-validated blueprint -> (in production) deterministic
// composer -> compiled bot. This app implements the blueprint + UI layers;
// the composer/compiler/payment backends are out of scope stubs (see README).

export type BlockRole = "entry" | "exit" | "filter";

export type BlockCategory =
  | "Timing"
  | "Structure"
  | "Levels"
  | "Indicators"
  | "Volatility"
  | "Filters"
  | "Risk"
  | "Exits";

export type ParamType = "select" | "number" | "text";

export interface ParamOption {
  value: string;
  label: string;
}

export interface ParamDef {
  key: string;
  label: string;
  type: ParamType;
  options?: ParamOption[];
  default: string | number;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface BlockDef {
  id: string;
  label: string;
  role: BlockRole;
  category: BlockCategory;
  icon: string; // Material Symbols glyph name
  description: string; // one-line, shown in the picker
  keywords: string[]; // used by the mock parser
  params: ParamDef[];
}

export interface BlockInstance {
  instanceId: string;
  blockId: string;
  params: Record<string, string | number>;
  /** 0-1. Below CONFIDENCE_THRESHOLD renders the amber left edge. */
  confidence: number;
}

export interface UnmappedClause {
  text: string;
  /** Why it couldn't be built (AI translator only). */
  reason?: string;
}

/** A question the AI translator asked instead of guessing. */
export interface ClarifyingQuestion {
  id: string;
  question: string;
  options: string[];
}

export interface Strategy {
  id: string;
  name: string;
  rawPrompt: string;
  readback: string;
  blocks: BlockInstance[];
  unmapped: UnmappedClause[];
  /** Set when the AI translator built this strategy in the rule language. The
   *  composer compiles these directly and `blocks` is empty. */
  rules?: RuleStrategy;
  /** Translator notes shown with the readback. */
  assumptions?: string[];
  warnings?: string[];
  /** Unanswered clarifying questions; the rules are a draft until these are answered or skipped. */
  questions?: ClarifyingQuestion[];
  /** Questions answered so far, sent back with the prompt on re-translation. */
  answers?: { question: string; answer: string }[];
  createdAt: number;
  updatedAt: number;
}

export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
}

/** How a trade's configured exit (if any) resolved against the synthetic path. */
/** "closed" = closed by a rule (time limit or opposite signal), not by the stop or target. */
export type TradeOutcome = "target" | "stopped" | "closed" | "open";

export interface SimulatedTrade {
  index: number;
  candle: number;
  direction: "buy" | "sell";
  /** Candle where the exit rule resolved. Unset while `outcome` is "open". */
  exitCandle?: number;
  outcome: TradeOutcome;
  /** Rule strategies only: the rules that held at entry, with the values the bot saw. */
  why?: string[];
  /** Rule strategies only: how the trade ended. */
  exitWhy?: string;
}

export interface SimulationResult {
  candles: Candle[]; // normalized 0-1 OHLC path
  trades: SimulatedTrade[];
  runAt: number;
}

export const CONFIDENCE_THRESHOLD = 0.75;
