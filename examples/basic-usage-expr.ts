import { mul, add } from "@scrawn/core";
import { biller } from "./scrawn/biller.ts";
import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  await biller.basicUsageEventConsumer({
    userId: "c0971bcb-b901-4c3e-a191-c9a97871c39f",
    debit: mul(biller.tag("PREMIUM_CALL"), 3),
  });

  await biller.basicUsageEventConsumer({
    userId: "c0971bcb-b901-4c3e-a191-c9a97871c39f",
    debit: mul(biller.tag("EXTRA_FEE"), 3),
  });

  await biller.basicUsageEventConsumer({
    userId: "c0971bcb-b901-4c3e-a191-c9a97871c39f",
    debit: add(biller.expr("COMPLEX_FEE"), mul(biller.tag("PREMIUM_CALL"), 5)),
  });

  // biller.expr() also accepts raw amounts and tags
  await biller.basicUsageEventConsumer({
    userId: "c0971bcb-b901-4c3e-a191-c9a97871c39f",
    debit: biller.expr(250),
  });

  await biller.basicUsageEventConsumer({
    userId: "c0971bcb-b901-4c3e-a191-c9a97871c39f",
    debit: biller.expr(biller.tag("EXTRA_FEE")),
  });

  console.log("Basic usage expression events consumed successfully");
}

main().catch(console.error);
