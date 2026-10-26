"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getBlock } from "./blocks";
import { parsePrompt, newStrategyName } from "./parser";
import { runStrategySimulation, strategyRules } from "./simulate";
import { trackEvent } from "./analytics";
import { describeRules, readbackText } from "./rules/describe";
import { validateRules } from "./rules/validate";
import { marketTimeframe } from "./rules/synthetic";
import { fromPayload, type MarketPayload, type MarketSeries } from "./market/types";
import type { BlockInstance, ClarifyingQuestion, SimulationResult, Strategy, UnmappedClause } from "./types";
import { FREE_SIMS, PRO_DAYS } from "./constants";

const STORAGE_KEY = "stratobot.strategy.v1";
const MISC_KEY = "stratobot.misc.v1";
const PRO_DURATION_MS = PRO_DAYS * 24 * 60 * 60 * 1000;

/** Pro is a 30-day pass from the moment of payment, not a perpetual unlock —
 *  re-derived from a timestamp rather than a stored boolean so it actually
 *  expires instead of silently staying true forever. */
function isProActive(paidAt: number | null): boolean {
  return paidAt !== null && Date.now() - paidAt < PRO_DURATION_MS;
}

/** Renders a "Run simulation" / "Run again" / "Simulate" button label given
 *  simsRemaining — which is Infinity during an active Pro pass. Centralized
 *  so every screen that spends a sim describes "unlimited" the same way. */
export function simsButtonLabel(verb: string, simsRemaining: number): string {
  if (simsRemaining === 0) return "No simulations left";
  if (!Number.isFinite(simsRemaining)) return `${verb} (unlimited)`;
  return `${verb} (${simsRemaining} left)`;
}

function emptyStrategy(rawPrompt = ""): Strategy {
  const now = Date.now();
  return {
    id: `strat-${now}`,
    name: newStrategyName(rawPrompt),
    rawPrompt,
    readback: "",
    blocks: [],
    unmapped: [],
    createdAt: now,
    updatedAt: now,
  };
}

type Answer = { question: string; answer: string };

interface TranslateResponse {
  status: "ready" | "needs_answers" | "not_a_strategy";
  rules: unknown;
  warnings: string[];
  questions: ClarifyingQuestion[];
  assumptions: string[];
  unmapped: UnmappedClause[];
}

/** Ask the AI translator. null = unavailable (no key, outage, invalid output): use the block parser. */
async function translate(prompt: string, answers: Answer[]): Promise<Partial<Strategy> | null> {
  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, answers }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as TranslateResponse | { fallback: true };
    if ("fallback" in data) return null;
    if (data.status === "not_a_strategy") {
      return { readback: "", blocks: [], rules: undefined, unmapped: [], questions: [], assumptions: [], warnings: [] };
    }
    // Re-validate: the readback and the compiled bot must come from rules this code accepts.
    const v = validateRules(data.rules);
    if (!v.ok) return null;
    return {
      rules: v.rules,
      blocks: [],
      readback: readbackText(describeRules(v.rules)),
      warnings: v.warnings,
      questions: data.questions ?? [],
      assumptions: data.assumptions ?? [],
      unmapped: data.unmapped ?? [],
      answers,
    };
  } catch {
    return null;
  }
}

interface MiscState {
  simsUsed: number;
  paidAt: number | null;
  disclaimerAccepted: boolean;
  /** The strategy that used this browser's free first EA. Edits to that same
   *  strategy stay unlocked; any other strategy needs a purchase. Browser-only
   *  until accounts exist, so it's a convenience cap, not an enforcement. */
  freeEaStrategyId?: string | null;
  /** Strategies bought one-off (KES per EA), confirmed by PayHero via /api/pay/status. */
  purchasedStrategyIds?: string[];
}

interface StoreValue {
  hydrated: boolean;
  strategy: Strategy | null;
  simResult: SimulationResult | null;
  /** Infinity while a 30-day Pro pass is active — always check with
   *  Number.isFinite() before rendering it as a plain number. */
  simsRemaining: number;
  /** Can download the current strategy: an active Pro pass, or this is the free first EA. */
  paid: boolean;
  /** This browser hasn't used its free first EA yet. */
  freeEaAvailable: boolean;
  /** Whole days left on the current Pro pass, or null if not active. */
  proDaysLeft: number | null;
  disclaimerAccepted: boolean;
  parsing: boolean;
  /** Real candles for the logic check (rule strategies). "unavailable" = no data provider or no data for it. */
  market: MarketSeries | null;
  marketStatus: "idle" | "loading" | "ready" | "unavailable";
  loadMarket: (symbol: string) => Promise<void>;
  /** Use candles the trader exported from their own MetaTrader (kept in memory only), or null for the made-up path. */
  setMarketSeries: (series: MarketSeries | null) => void;

  startFromPrompt: (rawPrompt: string) => Promise<void>;
  /** Re-translate with answers to the translator's questions. Returns false if the translator is unavailable. */
  answerQuestions: (answers: Answer[]) => Promise<boolean>;
  /** Keep the draft rules as they are and drop the open questions. */
  skipQuestions: () => void;
  startFromBlocks: () => void;
  loadPreset: (rawPrompt: string, name?: string) => void;
  addBlock: (blockId: string) => void;
  removeBlock: (instanceId: string) => void;
  moveBlock: (instanceId: string, direction: -1 | 1) => void;
  updateBlockParams: (instanceId: string, params: Record<string, string | number>) => void;
  runSim: () => void;
  runBatchSim: (count: number) => SimulationResult[];
  markPaid: () => void;
  /** Spend the free first EA on the current strategy. */
  claimFreeEa: () => void;
  /** Record a confirmed one-off purchase of a strategy's EA. */
  markEaPurchased: (strategyId: string) => void;
  acceptDisclaimer: () => void;
  resetAll: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StrategyProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [parsing, setParsing] = useState(false);
  const [market, setMarket] = useState<MarketSeries | null>(null);
  const [marketStatus, setMarketStatus] = useState<StoreValue["marketStatus"]>("idle");
  const [misc, setMisc] = useState<MiscState>({
    simsUsed: 0,
    paidAt: null,
    disclaimerAccepted: false,
  });

  // Hydrate from localStorage once on mount (client only). This has to run
  // post-mount rather than as a lazy useState initializer, otherwise the
  // client's first render would diverge from the server-rendered (storage-less)
  // markup and trigger a hydration mismatch.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setStrategy(JSON.parse(raw));
      const miscRaw = window.localStorage.getItem(MISC_KEY);
      if (miscRaw) setMisc(JSON.parse(miscRaw));
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (strategy) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(strategy));
  }, [strategy, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(MISC_KEY, JSON.stringify(misc));
  }, [misc, hydrated]);

  const startFromPrompt = useCallback(async (rawPrompt: string) => {
    setParsing(true);
    const base = emptyStrategy(rawPrompt);
    trackEvent("generation_started");

    const translated = await translate(rawPrompt, []);
    if (translated) {
      // "Generation" here = the strategy was turned into buildable rules (no text is sent).
      trackEvent(translated.rules ? "generation_succeeded" : "generation_failed", {
        path: "ai",
        questions: (translated.questions?.length ?? 0) > 0,
      });
      setStrategy({ ...base, ...translated });
      setSimResult(null);
      setParsing(false);
      return;
    }

    let parsed: ReturnType<typeof parsePrompt> | null = null;
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: rawPrompt }),
      });
      if (res.ok) {
        const data = await res.json();
        if (!data.fallback) parsed = data;
      }
    } catch {
      // network error — fall through to the local heuristic parser below
    }
    const path = parsed ? "ai_blocks" : "parser";
    if (!parsed) parsed = parsePrompt(rawPrompt);

    const next: Strategy = {
      ...base,
      readback: parsed.readback,
      blocks: parsed.blocks,
      unmapped: parsed.unmapped,
    };
    trackEvent(strategyRules(next) ? "generation_succeeded" : "generation_failed", {
      path,
      unmapped: parsed.unmapped.length,
    });
    setStrategy(next);
    setSimResult(null);
    setParsing(false);
  }, []);

  const answerQuestions = useCallback(
    async (answers: Answer[]) => {
      if (!strategy) return false;
      setParsing(true);
      const all = [...(strategy.answers ?? []), ...answers];
      const translated = await translate(strategy.rawPrompt, all);
      setParsing(false);
      if (!translated) return false;
      setStrategy((prev) => (prev ? { ...prev, ...translated, updatedAt: Date.now() } : prev));
      setSimResult(null);
      return true;
    },
    [strategy]
  );

  const skipQuestions = useCallback(() => {
    setStrategy((prev) => (prev ? { ...prev, questions: [], updatedAt: Date.now() } : prev));
  }, []);

  const loadMarket = useCallback(
    async (symbol: string) => {
      const rules = strategy ? strategyRules(strategy) : null;
      if (!rules) return;
      const tf = marketTimeframe(rules);
      if (market && market.symbol === symbol && market.tf === tf) return;
      setMarketStatus("loading");
      try {
        const res = await fetch(`/api/candles?symbol=${encodeURIComponent(symbol)}&tf=${tf}`);
        if (!res.ok) throw new Error(String(res.status));
        setMarket(fromPayload((await res.json()) as MarketPayload));
        setMarketStatus("ready");
      } catch {
        setMarket(null);
        setMarketStatus("unavailable");
      }
    },
    [strategy, market]
  );

  const setMarketSeries = useCallback((series: MarketSeries | null) => {
    setMarket(series);
    setMarketStatus(series ? "ready" : "idle");
    setSimResult(null);
  }, []);

  const startFromBlocks = useCallback(() => {
    setStrategy(emptyStrategy(""));
    setSimResult(null);
  }, []);

  const loadPreset = useCallback((rawPrompt: string, name?: string) => {
    const parsed = parsePrompt(rawPrompt);
    const base = emptyStrategy(rawPrompt);
    setStrategy({
      ...base,
      name: name ?? base.name,
      readback: parsed.readback,
      blocks: parsed.blocks,
      unmapped: parsed.unmapped,
    });
    setSimResult(null);
  }, []);

  const mutateStrategy = useCallback((fn: (s: Strategy) => Strategy) => {
    setStrategy((prev) => (prev ? { ...fn(prev), updatedAt: Date.now() } : prev));
  }, []);

  const addBlock = useCallback(
    (blockId: string) => {
      const def = getBlock(blockId);
      if (!def) return;
      const params: Record<string, string | number> = {};
      for (const p of def.params) params[p.key] = p.default;
      const instance: BlockInstance = {
        instanceId: `${blockId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        blockId,
        params,
        confidence: 1,
      };
      mutateStrategy((s) => ({ ...s, blocks: [...s.blocks, instance] }));
    },
    [mutateStrategy]
  );

  const removeBlock = useCallback(
    (instanceId: string) => {
      mutateStrategy((s) => ({
        ...s,
        blocks: s.blocks.filter((b) => b.instanceId !== instanceId),
      }));
    },
    [mutateStrategy]
  );

  const moveBlock = useCallback(
    (instanceId: string, direction: -1 | 1) => {
      // Blocks are grouped in the UI as Entry (everything) vs. Exit
      // (trailing_stop). Reordering moves within that same group, skipping
      // over any interleaved block from the other group, so the Adjust
      // screen's per-section up/down controls always do what they show.
      mutateStrategy((s) => {
        const isExit = (b: BlockInstance) => getBlock(b.blockId)?.role === "exit";
        const idx = s.blocks.findIndex((b) => b.instanceId === instanceId);
        if (idx === -1) return s;
        const group = isExit(s.blocks[idx]);
        let j = idx + direction;
        while (j >= 0 && j < s.blocks.length && isExit(s.blocks[j]) !== group) {
          j += direction;
        }
        if (j < 0 || j >= s.blocks.length) return s;
        const next = [...s.blocks];
        [next[idx], next[j]] = [next[j], next[idx]];
        return { ...s, blocks: next };
      });
    },
    [mutateStrategy]
  );

  const updateBlockParams = useCallback(
    (instanceId: string, params: Record<string, string | number>) => {
      mutateStrategy((s) => ({
        ...s,
        blocks: s.blocks.map((b) =>
          b.instanceId === instanceId
            ? { ...b, params: { ...b.params, ...params }, confidence: 1 }
            : b
        ),
      }));
    },
    [mutateStrategy]
  );

  const runSim = useCallback(() => {
    if (!strategy) return;
    const result = runStrategySimulation(strategy, misc.simsUsed, market);
    trackEvent("logic_check_run", { data: result.source?.kind ?? "synthetic" });
    setSimResult(result);
    setMisc((m) => ({ ...m, simsUsed: m.simsUsed + 1 }));
  }, [strategy, misc.simsUsed, market]);

  // Runs several logic-check passes at once (each a different synthetic path,
  // or a different stretch of the trader's own candles) and hands back every result for the
  // caller to aggregate. Kept separate from runSim/simResult so a batch
  // doesn't clobber the single-run view on the Simulate screen. Still
  // spends real simsRemaining credits, clamped to what's left.
  const runBatchSim = useCallback(
    (count: number): SimulationResult[] => {
      if (!strategy) return [];
      const available = isProActive(misc.paidAt)
        ? count
        : Math.max(0, FREE_SIMS - misc.simsUsed);
      const n = Math.max(0, Math.min(count, available));
      if (n === 0) return [];
      const results: SimulationResult[] = [];
      for (let i = 0; i < n; i++) {
        results.push(runStrategySimulation(strategy, misc.simsUsed + i, market));
      }
      setMisc((m) => ({ ...m, simsUsed: m.simsUsed + n }));
      return results;
    },
    [strategy, misc.simsUsed, misc.paidAt, market]
  );

  const markPaid = useCallback(() => setMisc((m) => ({ ...m, paidAt: Date.now() })), []);
  const claimFreeEa = useCallback(() => {
    if (!strategy) return;
    trackEvent("free_ea_claimed");
    setMisc((m) => (m.freeEaStrategyId ? m : { ...m, freeEaStrategyId: strategy.id }));
  }, [strategy]);
  const markEaPurchased = useCallback((strategyId: string) => {
    setMisc((m) =>
      m.purchasedStrategyIds?.includes(strategyId) ? m : { ...m, purchasedStrategyIds: [...(m.purchasedStrategyIds ?? []), strategyId] }
    );
  }, []);
  const acceptDisclaimer = useCallback(
    () => setMisc((m) => ({ ...m, disclaimerAccepted: true })),
    []
  );

  const resetAll = useCallback(() => {
    setStrategy(null);
    setSimResult(null);
    // The free-EA claim survives a reset: starting over shouldn't hand out another free EA.
    setMisc((m) => ({
      simsUsed: 0,
      paidAt: null,
      disclaimerAccepted: false,
      freeEaStrategyId: m.freeEaStrategyId,
      purchasedStrategyIds: m.purchasedStrategyIds,
    }));
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(MISC_KEY);
  }, []);

  // Date.now() is impure, so it can't be called directly during render (it
  // would make render output depend on wall-clock time rather than props/
  // state). Snapshot pro status in an effect instead, re-derived whenever
  // paidAt changes — same hydration-style pattern used for `strategy`/`misc`
  // above. Note: this means an extreme edge case (a tab left open
  // continuously for 30+ days with no navigation) could show stale "still
  // active" status until something re-triggers the effect — acceptable for
  // a client-only pass like this.
  // `forPaidAt` records which paidAt this snapshot was computed from; until it
  // matches the hydrated paidAt, the store reports hydrated: false. Otherwise
  // there's one render where storage is loaded but the pass reads inactive, and
  // the paid-gated pages (/download, /building) redirect paying users away.
  const [proStatus, setProStatus] = useState<{
    forPaidAt: number | null | undefined;
    active: boolean;
    daysLeft: number | null;
  }>({ forPaidAt: undefined, active: false, daysLeft: null });
  useEffect(() => {
    const active = isProActive(misc.paidAt);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProStatus({
      forPaidAt: misc.paidAt,
      active,
      daysLeft: active
        ? Math.max(1, Math.ceil((misc.paidAt! + PRO_DURATION_MS - Date.now()) / 86400000))
        : null,
    });
  }, [misc.paidAt]);

  const value = useMemo<StoreValue>(
    () => ({
      hydrated: hydrated && proStatus.forPaidAt === misc.paidAt,
      strategy,
      simResult,
      simsRemaining: proStatus.active ? Infinity : Math.max(0, FREE_SIMS - misc.simsUsed),
      paid:
        proStatus.active ||
        (!!strategy && (misc.freeEaStrategyId === strategy.id || !!misc.purchasedStrategyIds?.includes(strategy.id))),
      freeEaAvailable: !misc.freeEaStrategyId,
      proDaysLeft: proStatus.daysLeft,
      disclaimerAccepted: misc.disclaimerAccepted,
      parsing,
      market,
      marketStatus,
      loadMarket,
      setMarketSeries,
      startFromPrompt,
      answerQuestions,
      skipQuestions,
      startFromBlocks,
      loadPreset,
      addBlock,
      removeBlock,
      moveBlock,
      updateBlockParams,
      runSim,
      runBatchSim,
      markPaid,
      claimFreeEa,
      markEaPurchased,
      acceptDisclaimer,
      resetAll,
    }),
    [
      hydrated,
      strategy,
      simResult,
      misc,
      proStatus,
      parsing,
      market,
      marketStatus,
      loadMarket,
      setMarketSeries,
      startFromPrompt,
      answerQuestions,
      skipQuestions,
      startFromBlocks,
      runBatchSim,
      loadPreset,
      addBlock,
      removeBlock,
      moveBlock,
      updateBlockParams,
      runSim,
      markPaid,
      claimFreeEa,
      markEaPurchased,
      acceptDisclaimer,
      resetAll,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStrategyStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStrategyStore must be used within StrategyProvider");
  return ctx;
}
