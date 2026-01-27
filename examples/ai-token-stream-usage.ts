import { Scrawn, type AITokenUsagePayload } from "@scrawn/core";
import { config } from "dotenv";
config({ path: ".env.local" });

const scrawn = new Scrawn({
  apiKey: (process.env.SCRAWN_KEY || "") as `scrn_${string}`,
  baseURL: process.env.SCRAWN_BASE_URL || "http://localhost:8069",
});

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
// The stream is consumed and sent to backend, you just await the final response
async function fireAndForgetExample() {
  console.log("--- Fire-and-forget mode ---");

  const response = await scrawn.aiTokenStreamConsumer(tokenUsageFromAIStream());

  console.log(`Streamed ${response.eventsProcessed} token usage events`);
}

// Example 2: Return mode
// The stream is forked - one fork goes to billing (non-blocking),
// the other is returned to you for streaming to the user
async function returnModeExample() {
  console.log("\n--- Return mode (with stream passthrough) ---");

  const { response, stream } = await scrawn.aiTokenStreamConsumer(
    tokenUsageFromAIStream(),
    { return: true }
  );

  // Stream tokens to user while billing happens in background
  console.log("Streaming tokens to user:");
  for await (const token of stream) {
    console.log(
      `  -> ${token.model}: input=${token.inputTokens}, output=${token.outputTokens}`
    );
  }

  // Billing completes after stream is consumed
  const result = await response;
  console.log(`Billing complete: ${result.eventsProcessed} events processed`);
}

async function main() {
  await fireAndForgetExample();
  await returnModeExample();
}

main().catch(console.error);
