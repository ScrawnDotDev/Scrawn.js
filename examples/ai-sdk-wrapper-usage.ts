import * as ai from "ai";
import { google } from "@ai-sdk/google";
import { biller } from "./scrawn/biller.js";
import { config } from "dotenv";
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

  console.log(`Generated: "${await result.text}"\n`);
}

main().catch(console.error);
