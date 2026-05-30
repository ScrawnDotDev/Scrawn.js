import type { Scrawn } from "../scrawn.js";
import type {
  BillableAIOptions,
  BillableCallParams,
  ModelInfo,
} from "./types.js";

/** AI SDK function names that accept event callbacks and should be wrapped. */
const BILLABLE_FNS = [
  "streamText",
  "generateText",
  "streamObject",
  "generateObject",
] as const;

type BillableFnName = (typeof BILLABLE_FNS)[number];

/** An AI SDK module shape — duck-typed for flexibility. */
type AISDKModule = {
  [K in BillableFnName]?: (...args: any[]) => Promise<unknown>;
};

/**
 * Returns a proxied AI SDK module. Each text generation function is wrapped to:
 * 1. Accept a `userId` field (and optional billing overrides)
 * 2. Auto-inject `onStepFinish` to track billing on every step
 * 3. Chain the user's own `onStepFinish`/`onFinish` after billing
 *
 * The returned object has the same types as the original AI SDK,
 * with the billable params injected.
 */
export function createBillableAI<TTag extends string>(
  sdk: AISDKModule,
  biller: Scrawn<TTag>,
  opts: BillableAIOptions<TTag>
): Record<string, unknown> {
  const proxied: Record<string, unknown> = { ...sdk };

  for (const fnName of BILLABLE_FNS) {
    const original = sdk[fnName as BillableFnName];
    if (typeof original !== "function") continue;

    proxied[fnName] = (...args: unknown[]): unknown => {
      const params = (args[0] ?? {}) as Record<string, unknown>;
      const userId = params.userId as string | undefined;
      const billing: BillableCallParams<TTag> = extractBillingParams(params);

      if (userId === undefined || userId.trim() === "") {
        // No userId — pass through to original unchanged
        return original.apply(sdk, args);
      }

      const { onStepFinish: userStep, ...rest } = params;
      const billingParams = { ...rest };

      const defaults = {
        inputDebit: opts.inputDebit,
        outputDebit: opts.outputDebit,
        inputCacheDebit: opts.inputCacheDebit ?? opts.inputDebit,
        outputCacheDebit: opts.outputCacheDebit ?? opts.outputDebit,
        provider: opts.provider,
      };

      // Inject onStepFinish for per-step billing using biller.trackAI
      const billingStep = (event: {
        model: ModelInfo;
        usage: Record<string, unknown>;
      }) => {
        if (!event.usage) return;

        biller.trackAI({
          userId,
          event: {
            model: {
              modelId: event.model?.modelId ?? "unknown",
              provider: event.model?.provider ?? "unknown",
            },
            usage: {
              promptTokens: (event.usage as Record<string, number | undefined>)
                ?.inputTokens,
              completionTokens: (
                event.usage as Record<string, number | undefined>
              )?.outputTokens,
              totalTokens: (event.usage as Record<string, number | undefined>)
                ?.totalTokens,
            },
          },
          overrides: billing,
          defaults,
        });
      };

      // Chain billing + user callbacks
      if (
        typeof userStep === "function" ||
        userStep === undefined ||
        userStep === null
      ) {
        billingParams.onStepFinish = chainHandlers(
          billingStep,
          userStep as ((e: unknown) => void) | undefined
        );
      }

      return original.call(sdk, billingParams);
    };
  }

  return proxied;
}

function extractBillingParams<TTag extends string>(
  params: Record<string, unknown>
): BillableCallParams<TTag> {
  return {
    inputDebit: params.inputDebit as BillableCallParams<TTag>["inputDebit"],
    outputDebit: params.outputDebit as BillableCallParams<TTag>["outputDebit"],
    inputCacheDebit:
      params.inputCacheDebit as BillableCallParams<TTag>["inputCacheDebit"],
    outputCacheDebit:
      params.outputCacheDebit as BillableCallParams<TTag>["outputCacheDebit"],
  };
}

function chainHandlers(
  first: (e: { model: ModelInfo; usage: Record<string, unknown> }) => void,
  second:
    | ((e: { model: ModelInfo; usage: Record<string, unknown> }) => void)
    | undefined
): (e: { model: ModelInfo; usage: Record<string, unknown> }) => void {
  if (!second) return first;
  return (e: { model: ModelInfo; usage: Record<string, unknown> }) => {
    first(e);
    second(e);
  };
}
