import { Scrawn, add, mul, tag } from "@scrawn/core";
import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const scrawn = new Scrawn({
    apiKey: (process.env.SCRAWN_KEY || "") as `scrn_${string}`,
    baseURL: process.env.SCRAWN_BASE_URL || "http://localhost:8069",
  });

  await scrawn.sdkCallEventConsumer(
    {
      userId: "c0971bcb-b901-4c3e-a191-c9a97871c39f",
      debitExpr: tag("PREMIUM_FEATURE"),
    },
    {
      onError: (error) => {
        console.error("SDK call event failed:", error.message);
      },
    }
  );

  await scrawn.sdkCallEventConsumer(
    {
      userId: "c0971bcb-b901-4c3e-a191-c9a97871c39f",
      debitExpr: mul(tag("PER_CALL"), 3),
    },
    {
      onError: (error) => {
        console.error("SDK call event failed:", error.message);
      },
    }
  );

  await scrawn.sdkCallEventConsumer(
    {
      userId: "c0971bcb-b901-4c3e-a191-c9a97871c39f",
      debitExpr: add(mul(tag("BASE_RATE"), 5), tag("SURCHARGE"), 100),
    },
    {
      onError: (error) => {
        console.error("SDK call event failed:", error.message);
      },
    }
  );

  console.log("SDK call expression events consumed successfully");
}

main().catch(console.error);
