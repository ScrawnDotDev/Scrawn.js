import type { AITokenUsagePayload, Debit } from "../types/event.js";
import type {
  BillableCallParams,
  LanguageModelUsage,
  ModelInfo,
} from "./types.js";

/**
 * Builds an AITokenUsagePayload from an AI SDK step/finish event.
 * Falls back to regular debit pricing for cache tokens if not specified.
 */
export function buildAIPayload<TTag extends string = string>(
  userId: string,
  model: ModelInfo,
  usage: LanguageModelUsage,
  overrides: BillableCallParams<TTag>,
  defaults: {
    inputDebit: Debit<TTag>;
    outputDebit: Debit<TTag>;
    inputCacheDebit: Debit<TTag>;
    outputCacheDebit: Debit<TTag>;
    provider?: string;
  }
): AITokenUsagePayload<TTag> {
  return {
    userId,
    model: model.modelId,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    inputDebit: overrides.inputDebit ?? defaults.inputDebit,
    outputDebit: overrides.outputDebit ?? defaults.outputDebit,
    provider: overrides.provider ?? defaults.provider ?? model.provider,
    inputCacheTokens: usage.inputCachedTokens,
    inputCacheDebit: overrides.inputCacheDebit ?? defaults.inputCacheDebit,
    outputCacheTokens: usage.outputCachedTokens,
    outputCacheDebit: overrides.outputCacheDebit ?? defaults.outputCacheDebit,
  };
}
