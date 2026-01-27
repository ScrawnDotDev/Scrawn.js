import { describe, expect, it } from "vitest";
import { EventPayloadSchema } from "../../../src/core/types/event.js";
import { add, mul, tag } from "../../../src/core/pricing/index.js";

describe("EventPayloadSchema", () => {
  it("accepts payloads with debitAmount", () => {
    const result = EventPayloadSchema.safeParse({
      userId: "user_1",
      debitAmount: 10,
    });

    expect(result.success).toBe(true);
  });

  it("accepts payloads with debitTag", () => {
    const result = EventPayloadSchema.safeParse({
      userId: "user_1",
      debitTag: "PREMIUM",
    });

    expect(result.success).toBe(true);
  });

  it("accepts payloads with debitExpr (simple tag)", () => {
    const result = EventPayloadSchema.safeParse({
      userId: "user_1",
      debitExpr: tag("PREMIUM_CALL"),
    });

    expect(result.success).toBe(true);
  });

  it("accepts payloads with debitExpr (complex expression)", () => {
    const result = EventPayloadSchema.safeParse({
      userId: "user_1",
      debitExpr: add(mul(tag("PREMIUM_CALL"), 3), tag("EXTRA_FEE"), 250),
    });

    expect(result.success).toBe(true);
  });

  it("rejects payloads with both debitAmount and debitTag", () => {
    const result = EventPayloadSchema.safeParse({
      userId: "user_1",
      debitAmount: 5,
      debitTag: "PREMIUM",
    });

    expect(result.success).toBe(false);
  });

  it("rejects payloads with both debitAmount and debitExpr", () => {
    const result = EventPayloadSchema.safeParse({
      userId: "user_1",
      debitAmount: 5,
      debitExpr: tag("PREMIUM"),
    });

    expect(result.success).toBe(false);
  });

  it("rejects payloads with both debitTag and debitExpr", () => {
    const result = EventPayloadSchema.safeParse({
      userId: "user_1",
      debitTag: "PREMIUM",
      debitExpr: tag("OTHER"),
    });

    expect(result.success).toBe(false);
  });

  it("rejects payloads with all three debit fields", () => {
    const result = EventPayloadSchema.safeParse({
      userId: "user_1",
      debitAmount: 5,
      debitTag: "PREMIUM",
      debitExpr: tag("OTHER"),
    });

    expect(result.success).toBe(false);
  });

  it("rejects payloads without debit info", () => {
    const result = EventPayloadSchema.safeParse({
      userId: "user_1",
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid userId values", () => {
    const result = EventPayloadSchema.safeParse({
      userId: "",
      debitAmount: 2,
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid debitExpr (not a valid PriceExpr)", () => {
    const result = EventPayloadSchema.safeParse({
      userId: "user_1",
      debitExpr: { invalid: "expression" },
    });

    expect(result.success).toBe(false);
  });

  it("rejects debitExpr with invalid nested expression", () => {
    // Manually construct an invalid expression (non-integer amount)
    const result = EventPayloadSchema.safeParse({
      userId: "user_1",
      debitExpr: { kind: "amount", value: 2.5 },
    });

    expect(result.success).toBe(false);
  });
});
