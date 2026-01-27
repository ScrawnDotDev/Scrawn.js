import express from "express";
import { EventPayload, Scrawn } from "@scrawn/core";
import { config } from "dotenv";
config({ path: ".env.local" });

const scrawn = new Scrawn({
  apiKey: (process.env.SCRAWN_KEY || "") as `scrn_${string}`,
  baseURL: process.env.SCRAWN_BASE_URL || "http://localhost:8069",
});

// Create Express app
const app = express();
app.use(express.json());

app.use(
  scrawn.middlewareEventConsumer({
    extractor: (req): EventPayload => {
      // You gotta change this to fit your app's systumm
      return {
        userId: (req.headers?.["x-user-id"] as string) || "anonymous",
        debitAmount: req.body?.cost || 1,
      };
    },
    blacklist: ["/api/collect-payment", "/api/status"],
  })
);

// API Routes
app.post("/api/generate", (req, res) => {
  const { prompt } = req.body;

  const result = `Generated content for: ${prompt}`;

  res.json({
    success: true,
    result,
    billed: req.body?.cost || 1,
  });
});

app.post("/api/analyze", (req, res) => {
  const { data } = req.body;

  const analysis = {
    itemCount: data?.length || 0,
    summary: "Analysis complete",
  };

  res.json({
    success: true,
    analysis,
    billed: req.body?.cost || 1,
  });
});

app.post("/api/translate", (req, res) => {
  const { text, targetLang } = req.body;

  const translated = `[${targetLang}] ${text}`;

  res.json({
    success: true,
    translated,
    billed: req.body?.cost || 1,
  });
});

app.get("/api/status", (req, res) => {
  res.json({
    status: "ok",
    message: "Server is running",
  });
});

app.post("/api/collect-payment", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required",
      });
    }

    // Get checkout link from Scrawn
    const checkoutLink = await scrawn.collectPayment(userId);

    // Redirect user to payment page
    res.redirect(checkoutLink);
  } catch (error) {
    console.error("Failed to collect payment:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create checkout link",
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(
    `📊 Scrawn tracking enabled on all endpoints (except /api/collect-payment)`
  );
  console.log(`\nTry it out:`);
  console.log(`\nTrack an event:`);
  console.log(`curl -X POST http://localhost:${PORT}/api/generate \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -H "x-user-id: user_123" \\`);
  console.log(`  -d '{"prompt": "Hello world", "cost": 5}'`);
  console.log(`\nCollect payment (redirects to checkout):`);
  console.log(`curl -X POST http://localhost:${PORT}/api/collect-payment \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"userId": "user_123"}'`);
});
