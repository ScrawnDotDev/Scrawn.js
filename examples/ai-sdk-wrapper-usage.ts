import * as ai from "ai";
import { google } from "@ai-sdk/google";
import { biller } from "./scrawn/biller.js";
import { config } from "dotenv";
import { mul, outputTokens } from "@scrawn/core";
config({ path: ".env.local" });

async function main() {
  const aii = biller.ai(ai, {
    inputDebit: biller.tag("PREMIUM_CALL"),
    outputDebit: biller.expr("COMPLEX_FEE"),
  });

  const result = await aii.streamText({
    userId: "c0971bcb-b901-4c3e-a191-c9a97871c39f",
    model: google("gemini-2.5-flash"),
    prompt: "Write a 2 sentence story about a robot.",
  });

  const result1 = await ai.streamText({
    model: google("gemini-2.5-flash"),
    prompt: "Write a 2 sentence story about a robot.",
    onFinish: (event) => {
      biller.trackAI({
        userId: "c0971bcb-b901-4c3e-a191-c9a97871c39f",
        event,
        inputDebit: biller.tag("PREMIUM_CALL"),
        outputDebit: mul(outputTokens(), 0.0001),
      });
    },
  });

  console.log(`Generated: "${await result.text}"\n`);
}

main().catch(console.error);
