import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import {
  SYSTEM_PROMPT,
  TranslationSchema,
  interpretOutput,
  repairMessage,
  userMessage,
  type Translation,
  type TranslationOutput,
} from "./translate";

// The model call behind /api/translate, shared with the translation benchmark
// (scripts/translate-bench). Server-only: needs ANTHROPIC_API_KEY.

export const MODEL = "claude-opus-5-5";
// Translation accuracy is the product, so this runs at high effort.
export const EFFORT = "high" as const;

type Attempt = { output: TranslationOutput } | { fail: string };

async function attempt(client: Anthropic, content: string): Promise<Attempt> {
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    // On a safety decline, the API re-runs the request on Anthropic's recommended fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort: EFFORT, format: betaZodOutputFormat(TranslationSchema) },
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content }],
  });
  if (response.stop_reason === "refusal") return { fail: "refusal" };
  if (response.stop_reason === "max_tokens") return { fail: "max_tokens" };
  if (!response.parsed_output) return { fail: "unparsed" };
  return { output: response.parsed_output };
}

export type TranslateResult = { ok: true; translation: Translation; repaired: boolean } | { ok: false; reason: string; errors?: string[] };

/** Translate once; if the rules fail validation, retry once with the errors. */
export async function translateStrategy(client: Anthropic, prompt: string, answers: unknown): Promise<TranslateResult> {
  const first = await attempt(client, userMessage(prompt, answers));
  if ("fail" in first) return { ok: false, reason: first.fail };
  const checked = interpretOutput(first.output);
  if (checked.ok) return { ok: true, translation: checked.translation, repaired: false };

  const retry = await attempt(client, repairMessage(prompt, answers, first.output.rules_json, checked.errors));
  if ("fail" in retry) return { ok: false, reason: retry.fail };
  const rechecked = interpretOutput(retry.output);
  if (rechecked.ok) return { ok: true, translation: rechecked.translation, repaired: true };
  return { ok: false, reason: "invalid_rules", errors: rechecked.errors };
}
