import express from "express";
import { biller } from "./scrawn/biller.ts";
import { toWebRequest } from "@scrawn/core";

const app = express();

app.post(
  "/webhooks/scrawn",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      // Convert Express req to Web API Request & verify in one call
      const event = await biller.webhook(toWebRequest(req, req.body));

      console.log(`\n=== ${event.resource}.${event.action} ===`);
      console.log("ID:", event.id);
      console.log("Data:", JSON.stringify(event.data, null, 2));
      console.log("========================\n");

      // Handle based on event type — fully typed with intellisense
      switch (event.action) {
        case "succeeded":
          // event.data.amount   → number
          // event.data.currency → "usd"
          // event.data.mode     → "test" | "production"
          break;
        case "failed":
          // event.data.mode     → "test" | "production"
          break;
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Webhook verification failed:", error);
      res.status(401).json({ error: "Invalid signature" });
    }
  }
);

app.listen(3000, () => {
  console.log("Webhook receiver listening on http://localhost:3000");
  console.log("Register this URL with Scrawn:");
  console.log(
    `  curl -X POST http://localhost:8070/api/v1/internals/webhook-endpoint \\`
  );
  console.log(`    -H "Authorization: Bearer <your-api-key>" \\`);
  console.log(`    -H "Content-Type: application/json" \\`);
  console.log(`    -d '{"url": "http://localhost:3000/webhooks/scrawn"}'`);
});
