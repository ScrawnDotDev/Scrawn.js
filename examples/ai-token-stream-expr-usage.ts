import { type AITokenUsagePayload, mul, inputTokens, outputTokens } from "@scrawn/core";
import { biller } from "./scrawn/biller.ts";
import { config } from "dotenv";
config({ path: ".env.local" });

async function* tokenUsageFromAIStream(): AsyncGenerator<AITokenUsagePayload<"PREMIUM_CALL" | "EXTRA_FEE">> {
  const userId = "c0971bcb-b901-4c3e-a191-c9a97871c39f";

  yield {
    userId,
    model: "gpt-4",
    inputTokens: 150,
    outputTokens: 0,
    inputDebit: { expr: biller.expr("PER_TOKEN_INPUT") },
    outputDebit: { expr: biller.expr(mul(biller.tag("EXTRA_FEE"), outputTokens())) },
  };

  yield {
    userId,
    model: "gpt-4",
    inputTokens: 0,
    outputTokens: 75,
    inputDebit: { expr: biller.expr(mul(biller.tag("PREMIUM_CALL"), inputTokens())) },
    outputDebit: { expr: biller.expr(mul(biller.tag("EXTRA_FEE"), outputTokens())) },
  };
}

async function main() {
  const response = await biller.aiTokenStreamConsumer(tokenUsageFromAIStream());
  if (!response) {
    console.log("No token events were processed due to an error");
    return;
  }
  console.log(
    `Streamed ${response.getEventsprocessed()} token usage events with expression pricing`
  );
}

main().catch(console.error);
