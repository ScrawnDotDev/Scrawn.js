# @scrawn/core

TypeScript SDK for [Scrawn](https://github.com/ScrawnDotDev/Scrawn) — the
open-source usage-based billing engine. Track events, define pricing expressions,
bill AI token usage, collect payments, and verify webhooks — all through a
single type-safe client.

## Installation

```bash
npm install @scrawn/core @scrawn/analytics
```

## Quick start

```typescript
import { scrawn, mul } from "@scrawn/core";

const biller = scrawn({
  apiKey: process.env.SCRAWN_KEY,
  baseURL: process.env.SCRAWN_BASE_URL,
  httpUrl: process.env.SCRAWN_HTTP_URL,
});

// Track a billable event — 250 cents flat rate
await biller.basicUsageEventConsumer({
  userId: "user-123",
  debit: 250,
});

// Or with pricing expressions: (API_CALL × 3) + 250
await biller.basicUsageEventConsumer({
  userId: "user-123",
  debit: biller.expr(add(mul(biller.tag("API_CALL"), 3), 250)),
});
```

## Examples

See the [`examples/`](./examples) directory for complete usage:

- [`basic-usage.ts`](./examples/basic-usage.ts) — flat-rate and tag-based billing
- [`basic-usage-expr.ts`](./examples/basic-usage-expr.ts) — pricing expressions and persistent expressions
- [`ai-sdk-wrapper-usage.ts`](./examples/ai-sdk-wrapper-usage.ts) — AI token tracking with any AI SDK
- [`ai-token-stream-usage.ts`](./examples/ai-token-stream-usage.ts) — streaming token usage
- [`middleware-usage.ts`](./examples/middleware-usage.ts) — Express/Fastify middleware
- [`analytics-usage.ts`](./examples/analytics-usage.ts) — analytics queries

## Docs

Full documentation at [docs.scrawn.dev](https://docs.scrawn.dev)
