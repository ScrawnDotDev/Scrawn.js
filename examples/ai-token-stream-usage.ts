import { type AITokenUsagePayload } from "@scrawn/core";
import { biller } from "./scrawn/biller";
import { config } from "dotenv";
config({ path: ".env.local" });

// Simulate what your AI provider wrapper would do:
// As tokens stream from OpenAI/Anthropic/etc, you yield usage events
async function* tokenUsageFromAIStream(): AsyncGenerator<AITokenUsagePayload> {
  const userId = "c0971bcb-b901-4c3e-a191-c9a97871c39f";

  // Initial prompt tokens
  yield {
    userId,
    model: "gpt-4",
    inputTokens: 150,
    outputTokens: 0,
    inputDebit: { amount: 0.0045 },
    outputDebit: { amount: 0 },
  };

  // Output tokens as they stream
  yield {
    userId,
    model: "gpt-4",
    inputTokens: 0,
    outputTokens: 75,
    inputDebit: { amount: 0 },
    outputDebit: { amount: 0.0045 },
  };
}

// Example 1: Fire-and-forget mode (default)
async function fireAndForgetExample() {
  console.log("--- Fire-and-forget mode ---");

  const response = await biller.aiTokenStreamConsumer(tokenUsageFromAIStream());

  if (!response) {
    console.log("No token events were processed due to an error");
    return;
  }

  console.log(`Streamed ${response.getEventsprocessed()} token usage events`);
}

// Example 2: Return mode
async function returnModeExample() {
  console.log("\n--- Return mode (with stream passthrough) ---");

  const { response, stream } = await biller.aiTokenStreamConsumer(
    tokenUsageFromAIStream(),
    { return: true }
  );

  console.log("Streaming tokens to user:");
  for await (const token of stream) {
    console.log(
      `  -> ${token.model}: input=${token.inputTokens}, output=${token.outputTokens}`
    );
  }

  const result = await response;
  if (!result) {
    console.log("Billing failed before processing events");
    return;
  }
  console.log(`Billing complete: ${result.getEventsprocessed()} events processed`);
}

async function main() {
  await fireAndForgetExample();
  await returnModeExample();
}

main().catch(console.error);
