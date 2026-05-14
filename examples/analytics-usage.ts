import { Analytics, eq, neq, gt, and, asc, desc, sum, count } from "@scrawn/analytics";
import { biller } from "./scrawn/biller.ts";
import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const analytics = new Analytics(biller);

  const { sdkEvent, aiToken, payment } = analytics.query;
  const { users, tags, sessions, expressions, metadata } = analytics.data;

  // ── Event Queries ──

  // List recent SDK call events
  const recentSdkCalls = await sdkEvent
    .where(eq(sdkEvent.fields.sdkCallType, "RAW"))
    .orderBy(desc(sdkEvent.fields.reportedTimestamp))
    .limit(10)
    .execute();
  console.log("Recent SDK calls:", JSON.stringify(recentSdkCalls, null, 2));

  // Middleware events with high debit
  const expensiveMiddleware = await sdkEvent
    .where(and(
      eq(sdkEvent.fields.sdkCallType, "MIDDLEWARE_CALL"),
      gt(sdkEvent.fields.debitAmount, 100),
    ))
    .orderBy(desc(sdkEvent.fields.debitAmount))
    .limit(5)
    .execute();
  console.log("Expensive middleware calls:", JSON.stringify(expensiveMiddleware, null, 2));

  // AI token usage for a specific model
  const gpt4Usage = await aiToken
    .where(eq(aiToken.fields.model, "gpt-4"))
    .orderBy(desc(aiToken.fields.reportedTimestamp))
    .limit(20)
    .execute();
  console.log("GPT-4 token usage:", JSON.stringify(gpt4Usage, null, 2));

  // Total debit per user (aggregation)
  const totalByUser = await sdkEvent
    .where(gt(sdkEvent.fields.debitAmount, 0))
    .aggregate(sum(sdkEvent.fields.debitAmount))
    .groupBy(sdkEvent.fields.userId)
    .limit(10)
    .execute();
  console.log("Total debit by user:", JSON.stringify(totalByUser, null, 2));

  // Count of payment events
  const paymentCount = await payment
    .aggregate(count())
    .execute();
  console.log("Payment events:", JSON.stringify(paymentCount, null, 2));

  // ── Data Queries ──

  // List production users
  const prodUsers = await users
    .where(and(
      neq(users.fields.id, ""),
      eq(users.fields.mode, "production"),
    ))
    .orderBy(asc(users.fields.id))
    .limit(10)
    .execute();
  console.log("Production users:", JSON.stringify(prodUsers, null, 2));

  // List all tags
  const allTags = await tags
    .orderBy(asc(tags.fields.key))
    .limit(50)
    .execute();
  console.log("Tags:", JSON.stringify(allTags, null, 2));

  // Unprocessed sessions
  const unprocessedSessions = await sessions
    .where(eq(sessions.fields.processed, "false"))
    .limit(10)
    .execute();
  console.log("Unprocessed sessions:", JSON.stringify(unprocessedSessions, null, 2));
}

main().catch(console.error);
