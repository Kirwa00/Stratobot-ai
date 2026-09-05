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
import { runSimulation } from "./simulate";
import type { BlockInstance, SimulationResult, Strategy } from "./types";

const STORAGE_KEY = "stratobot.strategy.v1";
const MISC_KEY = "stratobot.misc.v1";
const FREE_SIMS = 5;

function emptyStrategy(rawPrompt = ""): Strategy {
  const now = Date.now();
  return {
    id: `strat-${now}`,
    name: newStrategyName(),
    rawPrompt,
    readback: "",
    blocks: [],
    unmapped: [],
    createdAt: now,
    updatedAt: now,
  };
}

interface MiscState {
  simsUsed: number;
  paid: boolean;
  disclaimerAccepted: boolean;
}

interface StoreValue {
  hydrated: boolean;
  strategy: Strategy | null;
  simResult: SimulationResult | null;
  simsRemaining: number;
  paid: boolean;
  disclaimerAccepted: boolean;
  parsing: boolean;

  startFromPrompt: (rawPrompt: string) => Promise<void>;
  startFromBlocks: () => void;
  loadPreset: (rawPrompt: string, name?: string) => void;
  addBlock: (blockId: string) => void;
  removeBlock: (instanceId: string) => void;
  moveBlock: (instanceId: string, direction: -1 | 1) => void;
  updateBlockParams: (instanceId: string, params: Record<string, string | number>) => void;
  runSim: () => void;
  runBatchSim: (count: number) => SimulationResult[];
  markPaid: () => void;
  acceptDisclaimer: () => void;
  resetAll: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StrategyProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [parsing, setParsing] = useState(false);
  const [misc, setMisc] = useState<MiscState>({
    simsUsed: 0,
    paid: false,
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
    if (!parsed) parsed = parsePrompt(rawPrompt);

    setStrategy({
      ...base,
      readback: parsed.readback,
      blocks: parsed.blocks,
      unmapped: parsed.unmapped,
    });
    setSimResult(null);
    setParsing(false);
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
    setStrategy((prev) => {
      if (!prev) return prev;
      const result = runSimulation(prev.blocks, misc.simsUsed);
      setSimResult(result);
      return prev;
    });
    setMisc((m) => ({ ...m, simsUsed: m.simsUsed + 1 }));
  }, [misc.simsUsed]);

  // Runs several logic-check passes at once (each still a fresh synthetic
  // path — never real market data) and hands back every result for the
  // caller to aggregate. Kept separate from runSim/simResult so a batch
  // doesn't clobber the single-run view on the Simulate screen. Still
  // spends real simsRemaining credits, clamped to what's left.
  const runBatchSim = useCallback(
    (count: number): SimulationResult[] => {
      if (!strategy) return [];
      const available = Math.max(0, FREE_SIMS - misc.simsUsed);
      const n = Math.max(0, Math.min(count, available));
      if (n === 0) return [];
      const results: SimulationResult[] = [];
      for (let i = 0; i < n; i++) {
        results.push(runSimulation(strategy.blocks, misc.simsUsed + i));
      }
      setMisc((m) => ({ ...m, simsUsed: m.simsUsed + n }));
      return results;
    },
    [strategy, misc.simsUsed]
  );

  const markPaid = useCallback(() => setMisc((m) => ({ ...m, paid: true })), []);
  const acceptDisclaimer = useCallback(
    () => setMisc((m) => ({ ...m, disclaimerAccepted: true })),
    []
  );

  const resetAll = useCallback(() => {
    setStrategy(null);
    setSimResult(null);
    setMisc({ simsUsed: 0, paid: false, disclaimerAccepted: false });
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(MISC_KEY);
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      hydrated,
      strategy,
      simResult,
      simsRemaining: Math.max(0, FREE_SIMS - misc.simsUsed),
      paid: misc.paid,
      disclaimerAccepted: misc.disclaimerAccepted,
      parsing,
      startFromPrompt,
      startFromBlocks,
      loadPreset,
      addBlock,
      removeBlock,
      moveBlock,
      updateBlockParams,
      runSim,
      runBatchSim,
      markPaid,
      acceptDisclaimer,
      resetAll,
    }),
    [
      hydrated,
      strategy,
      simResult,
      misc,
      parsing,
      startFromPrompt,
      startFromBlocks,
      runBatchSim,
      loadPreset,
      addBlock,
      removeBlock,
      moveBlock,
      updateBlockParams,
      runSim,
      markPaid,
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
