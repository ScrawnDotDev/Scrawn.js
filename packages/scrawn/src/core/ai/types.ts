import type { DebitField } from "../types/event.js";

/**
 * Configuration for the biller.ai() wrapper.
 * Default billing settings applied automatically to all AI SDK calls.
 */
export interface BillableAIOptions<TTag extends string = string> {
  /** Default billing for input tokens (required). */
  inputDebit: DebitField<TTag>;
  /** Default billing for output tokens (required). */
  outputDebit: DebitField<TTag>;
  /** Default billing for cached input tokens. Falls back to inputDebit if not set. */
  inputCacheDebit?: DebitField<TTag>;
  /** Default billing for cached output tokens. Falls back to outputDebit if not set. */
  outputCacheDebit?: DebitField<TTag>;
  /** Default provider override. If not set, auto-detected from the model's provider. */
  provider?: string;
}

/**
 * Additional fields injected by the AI SDK wrapper into function params.
 * All original AI SDK params are preserved; only userId is added.
 */
export interface BillableCallParams<TTag extends string = string> {
  /** The user ID to bill against. */
  userId: string;
  /** Override input token billing for this specific call. */
  inputDebit?: DebitField<TTag>;
  /** Override output token billing for this specific call. */
  outputDebit?: DebitField<TTag>;
  /** Override cached input token billing for this specific call. */
  inputCacheDebit?: DebitField<TTag>;
  /** Override cached output token billing for this specific call. */
  outputCacheDebit?: DebitField<TTag>;
  /** Override provider for this specific call. */
  provider?: string;
}

/**
 * Strips the BillableCallParams from a type, leaving only original AI SDK params.
 * Used internally to forward the original params to the real AI SDK.
 */
export type StripScrawnParams<T> = Omit<T, keyof BillableCallParams>;

/**
 * Language model usage as returned by Vercel AI SDK event listeners.
 * Matches the shape of OnStepFinishEvent.usage and OnFinishEvent.totalUsage.
 */
export interface LanguageModelUsage {
  /** Number of input (prompt) tokens consumed. */
  inputTokens: number;
  /** Number of output (completion) tokens consumed. */
  outputTokens: number;
  /** Total tokens consumed (inputTokens + outputTokens). */
  totalTokens: number;
  /** Cached input tokens (e.g., prompt caching). */
  inputCachedTokens?: number;
  /** Cached output tokens. */
  outputCachedTokens?: number;
}

/**
 * Minimal subset of the AI SDK model info needed for billing.
 * Comes from OnStepFinishEvent.model or OnFinishEvent.model.
 */
export interface ModelInfo {
  /** Model ID, e.g. "gpt-4o-mini". */
  modelId: string;
  /** Provider name, e.g. "openai", "anthropic". */
  provider: string;
}

// ── Billable AI SDK type mapping ──

/** Keys in the AI SDK that we wrap with billing. */
type BillableKeys =
  | "streamText"
  | "generateText"
  | "streamObject"
  | "generateObject";

/**
 * Given the original AI SDK type TSDK, replaces the wrapped function
 * signatures with widened versions that accept `userId`. Preserves the
 * original param types via conditional inference and the original return
 * types unchanged.
 *
 * All other AI SDK properties pass through via Omit.
 */
export type WithUserId<TSDK extends Record<string, unknown>> = Omit<
  TSDK,
  BillableKeys
> & {
  streamText: TSDK extends { streamText: (params: infer P) => infer R }
    ? (params: P & BillableCallParams) => R
    : never;
  generateText: TSDK extends { generateText: (params: infer P) => infer R }
    ? (params: P & BillableCallParams) => R
    : never;
  streamObject: TSDK extends { streamObject: (params: infer P) => infer R }
    ? (params: P & BillableCallParams) => R
    : never;
  generateObject: TSDK extends { generateObject: (params: infer P) => infer R }
    ? (params: P & BillableCallParams) => R
    : never;
};
