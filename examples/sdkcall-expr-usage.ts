import { mul } from "@scrawn/core";
import { biller } from "./scrawn/biller";
import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  await biller.sdkCallEventConsumer(
    {
      userId: "c0971bcb-b901-4c3e-a191-c9a97871c39f",
      debitExpr: mul(biller.tag("PREMIUM_FEATURE"), 3),
      //           ^^^^^^^^^^ compile-time checked: only "PREMIUM_CALL" | "EXTRA_FEE" allowed
    }
  );

  await biller.sdkCallEventConsumer(
    {
      userId: "c0971bcb-b901-4c3e-a191-c9a97871c39f",
      debitExpr: mul(biller.tag("EXTRA_FEE"), 3),
    }
  );

  await biller.sdkCallEventConsumer(
    {
      userId: "c0971bcb-b901-4c3e-a191-c9a97871c39f",
      debitExpr: mul(biller.tag("PREMIUM_CALL"), 5),
    }
  );

  console.log("SDK call expression events consumed successfully");
}

main().catch(console.error);
