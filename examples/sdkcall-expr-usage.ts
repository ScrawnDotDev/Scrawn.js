import { mul, add } from "@scrawn/core";
import { biller } from "./scrawn/biller.ts";
import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  await biller.sdkCallEventConsumer({
    userId: "c0971bcb-b901-4c3e-a191-c9a97871c39f",
    debitExpr: biller.expr(mul(biller.tag("PREMIUM_CALL"), 3)),
  });

  await biller.sdkCallEventConsumer({
    userId: "c0971bcb-b901-4c3e-a191-c9a97871c39f",
    debitExpr: biller.expr(mul(biller.tag("EXTRA_FEE"), 3)),
  });

  await biller.sdkCallEventConsumer({
    userId: "c0971bcb-b901-4c3e-a191-c9a97871c39f",
    debitExpr: biller.expr(
      add(biller.expr("COMPLEX_FEE"), mul(biller.tag("PREMIUM_CALL"), 5))
    ),
  });

  console.log("SDK call expression events consumed successfully");
}

main().catch(console.error);
