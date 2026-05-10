import { biller } from "./scrawn/biller.ts";

async function main() {
  await biller.sdkCallEventConsumer(
    {
      userId: "c0971bcb-b901-4c3e-a191-c9a97871c39f",
      debitAmount: 3000,
    }
  );

  await biller.sdkCallEventConsumer(
    {
      userId: "c0971bcb-b901-4c3e-a191-c9a97871c39f",
      debitTag: "PREMIUM_CALL",
    }
  );

  console.log("SDK call events consumed successfully");
}

main().catch(console.error);
