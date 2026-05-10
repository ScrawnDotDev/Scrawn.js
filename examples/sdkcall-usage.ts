import { biller } from "./scrawn/biller";
import { config } from "dotenv";
config({ path: ".env.local" });

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
      //       ^^^^^^^^^^^^^ compile-time checked
    }
  );

  console.log("SDK call events consumed successfully");
}

main().catch(console.error);
