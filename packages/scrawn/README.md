# Scrawn SDK

## What is Scrawn.js?

Scrawn.js is the official TypeScript SDK for integrating Scrawn's usage-based billing into your applications. It provides a simple, type-safe interface for tracking usage events and collecting payments via gRPC.

[View Docs](https://scrawn.vercel.app/docs/scrawn-js)

## Key Features

- **Simple API** - Track usage with a single function call
- **Type-Safe** - Full TypeScript support with auto-completion
- **gRPC-Powered** - Built on Connect-RPC for efficient communication
- **Framework Agnostic** - Works with any JavaScript framework
- **Middleware Support** - Built-in middleware with whitelist/blacklist patterns

## Installation

Install Scrawn.js in your project:

```bash
bun add @scrawn/core
```

## Quick Example

```typescript
import { scrawn } from "@scrawn/core";

const biller = scrawn({
  apiKey: process.env.SCRAWN_KEY as `scrn_${string}`,
  baseURL: process.env.SCRAWN_BASE_URL || "http://localhost:8069",
});

// Track a billable event
await biller.sdkCallEventConsumer({
  userId: "user-123",
  debitAmount: 100,
});
```
