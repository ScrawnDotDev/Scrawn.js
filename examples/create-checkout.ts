import { biller } from "./scrawn/biller.ts";

const userId = "c0971bcb-b901-4c3e-a191-c9a97871c30f";

const url = await biller.collectPayment(userId);

console.log(`\nCheckout URL for ${userId}:`);
console.log(url);
console.log();
