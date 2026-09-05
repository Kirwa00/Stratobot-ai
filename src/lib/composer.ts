import { composeMQL5FromStrategy, generateCompositionSummary } from "./deterministic-composer";
import type { Strategy } from "./types";

// Real deterministic composer from Engineering Plan v1.2 §1/§2:
// "Trader prompt → LLM → Blueprint JSON → deterministic composer → MQL5 → compiler"
// This now generates actual, compilable MQL5 code using hand-written templates.
// The MetaEditor CLI pipeline (Workstream A) is still a separate backend service,
// but this composer produces real MQL5 code that can be compiled.

export function composeStrategyFile(strategy: Strategy): string {
  const result = composeMQL5FromStrategy(strategy, {
    includeComments: true,
    strictMode: false, // Allow warnings but still generate code
    validateInputs: true
  });

  if (!result.success || !result.code) {
    // Fallback to basic error message if composition fails
    return `// StratoBot AI — Composition Error
// Strategy: ${strategy.name}
// 
// Unable to generate MQL5 code for this strategy.
// Errors: ${result.errors?.join(", ") || "Unknown error"}
// 
// Please check your strategy configuration and try again.`;
  }

  return result.code;
}

export function getCompositionSummary(strategy: Strategy): string {
  return generateCompositionSummary(strategy);
}

export function downloadFile(filename: string, contents: string) {
  const blob = new Blob([contents], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
