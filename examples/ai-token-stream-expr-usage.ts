import { Scrawn, type AITokenUsagePayload, mul, tag, inputTokens, outputTokens } from "@scrawn/core";
import { config } from "dotenv";
config({ path: ".env.local" });

const scrawn = new Scrawn({
  apiKey: (process.env.SCRAWN_KEY || "") as `scrn_${string}`,
  baseURL: process.env.SCRAWN_BASE_URL || "http://localhost:8069",
});

// inputTokens() and outputTokens() are placeholders that resolve to the actual
// token counts from each stream item before being sent to the backend
async function* tokenUsageFromAIStream(): AsyncGenerator<AITokenUsagePayload> {
  const userId = "c0971bcb-b901-4c3e-a191-c9a97871c39f";

  yield {
    userId,
    model: "gpt-4",
    inputTokens: 150,
    outputTokens: 0,
    inputDebit: { expr: mul(tag("GPT_INPUT_RATE"), inputTokens()) },
    outputDebit: { expr: mul(tag("GPT_OUTPUT_RATE"), outputTokens()) },
  };

  yield {
    userId,
    model: "gpt-4",
    inputTokens: 0,
    outputTokens: 75,
    inputDebit: { expr: mul(tag("GPT_INPUT_RATE"), inputTokens()) },
    outputDebit: { expr: mul(tag("GPT_OUTPUT_RATE"), outputTokens()) },
  };
}

async function main() {
  const response = await scrawn.aiTokenStreamConsumer(tokenUsageFromAIStream());
  if (!response) {
    console.log("No token events were processed due to an error");
    return;
  }
  console.log(
    `Streamed ${response.getEventsprocessed()} token usage events with expression pricing`
  );
}

main().catch(console.error);
