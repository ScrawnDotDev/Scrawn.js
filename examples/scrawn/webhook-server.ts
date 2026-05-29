import express from "express";
import { scrawn, toWebRequest } from "@scrawn/core";
import { biller } from "./biller.ts";

const app = express();

app.post(
  "/webhooks/scrawn",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const event = await biller.webhook(toWebRequest(req, req.body));

      console.log(`\n=== ${event.resource}.${event.action} ===`);
      console.log("ID:", event.id);
      console.log("Data:", JSON.stringify(event.data, null, 2));
      console.log("========================\n");

      res.status(200).json({ received: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Webhook verification failed:", message);
      res.status(401).json({ error: message });
    }
  }
);

app.listen(3000, () => {
  console.log("Webhook receiver listening on http://localhost:3000");
});
