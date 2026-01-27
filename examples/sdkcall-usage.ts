import { Scrawn } from "@scrawn/core";
import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const scrawn = new Scrawn({
    apiKey: (process.env.SCRAWN_KEY || "") as `scrn_${string}`,
    baseURL: process.env.SCRAWN_BASE_URL || "http://localhost:8069",
  });

  await scrawn.sdkCallEventConsumer({
    userId: "c0971bcb-b901-4c3e-a191-c9a97871c39f",
    debitAmount: 3000,
  });

  await scrawn.sdkCallEventConsumer({
    userId: "c0971bcb-b901-4c3e-a191-c9a97871c39f",
    debitTag: "PREMIUM_FEATURE",
  });

  console.log("SDK call events consumed successfully");

  // const checkoutLink = await scrawn.collectPayment('c0971bcb-b901-4c3e-a191-c9a97871c39f');
  // console.log('Checkout link created:', checkoutLink, "\nGo to the link to complete the payment.");
}

main().catch(console.error);
