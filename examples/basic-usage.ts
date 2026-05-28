import { biller } from "./scrawn/biller.ts";

async function main() {
  await biller.basicUsageEventConsumer({
    userId: "c0971bcb-b901-4c3e-a191-c9a97871c39f",
    debit: 3000,
  });

  await biller.basicUsageEventConsumer({
    userId: "c0971bcb-b901-4c3e-a191-c9a97871c39f",
    debit: biller.tag("PREMIUM_CALL"),
  });

  console.log("Basic usage events consumed successfully");
}

main().catch(console.error);
