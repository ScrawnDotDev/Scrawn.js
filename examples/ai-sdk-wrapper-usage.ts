import * as ai from "ai";
import { openai } from "@ai-sdk/openai";
import { biller } from "./scrawn/biller.js";
import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env.local" });

// Helper: cast the wrapped function back to a usable callable type
type WrappedFn = (
  params: Record<string, unknown>
) => Promise<Record<string, unknown>>;

async function main() {
  // ── Level 1: Auto-billing via biller.ai() wrapper ──

  const aii = biller.ai(ai, {
    inputDebit: { tag: "PREMIUM_CALL" },
    outputDebit: { tag: "EXTRA_FEE" },
  });

  console.log("--- Level 1: biller.ai() auto-wrapper (streamText) ---");

  const wrappedStreamText = aii.streamText as WrappedFn;
  const result = await wrappedStreamText({
    userId: "c0971bcb-b901-4c3e-a191-c9a97871c39f",
    model: openai("gpt-4o-mini"),
    prompt: "Write a 2 sentence story about a robot.",
  });
  console.log(
    `  Generated: "${((await result.text) as string).slice(0, 80)}..."\n`
  );

  // ── Level 1: With user's own onStepFinish ──

  console.log("--- Level 1: With user onStepFinish callback ---");

  await wrappedStreamText({
    userId: "c0971bcb-b901-4c3e-a191-c9a97871c39f",
    model: openai("gpt-4o-mini"),
    prompt: "Say hello in Spanish.",
    onStepFinish: (event: {
      stepNumber: number;
      usage: { totalTokens?: number };
    }) => {
      console.log(
        `  Step ${event.stepNumber}: ${event.usage.totalTokens ?? 0} tokens`
      );
    },
  });

  console.log();

  // ── Level 2: Manual biller.trackAI() ──

  console.log("--- Level 2: Manual biller.trackAI() in onStepFinish ---");

  const manualResult = await ai.streamText({
    model: openai("gpt-4o-mini"),
    prompt: "Say hello in French.",
    onStepFinish: (event: {
      model: { modelId: string; provider: string };
      usage: {
        inputTokens?: number;
        outputTokens?: number;
        totalTokens?: number;
      };
    }) => {
      biller.trackAI(
        "c0971bcb-b901-4c3e-a191-c9a97871c39f",
        { modelId: event.model.modelId, provider: event.model.provider },
        {
          inputTokens: event.usage.inputTokens ?? 0,
          outputTokens: event.usage.outputTokens ?? 0,
          totalTokens:
            (event.usage.inputTokens ?? 0) + (event.usage.outputTokens ?? 0),
        },
        { userId: "" },
        {
          inputDebit: { tag: "PREMIUM_CALL" },
          outputDebit: { tag: "EXTRA_FEE" },
          inputCacheDebit: { tag: "PREMIUM_CALL" },
          outputCacheDebit: { tag: "EXTRA_FEE" },
        }
      );
      console.log(`  Tracked ${event.usage.totalTokens} tokens`);
    },
  });

  console.log(`  Generated: "${await manualResult.text}"\n`);
  console.log("All AI SDK wrapper examples completed.");
}

main().catch(console.error);
