import { describe, expect, it } from "vitest";
import { EventPayloadSchema } from "../../../src/core/types/event.js";
import {
  add,
  mul,
  tag,
  inputTokens,
  outputTokens,
} from "../../../src/core/pricing/index.js";

describe("EventPayloadSchema", () => {
  it("accepts payloads with debit as a number", () => {
    const result = EventPayloadSchema.safeParse({
      userId: "user_1",
      debit: 10,
    });

    expect(result.success).toBe(true);
  });

  it("accepts payloads with debit as a tag expression", () => {
    const result = EventPayloadSchema.safeParse({
      userId: "user_1",
      debit: tag("PREMIUM"),
    });

    expect(result.success).toBe(true);
  });

  it("accepts payloads with debit as a simple expression", () => {
    const result = EventPayloadSchema.safeParse({
      userId: "user_1",
      debit: tag("PREMIUM_CALL"),
    });

    expect(result.success).toBe(true);
  });

  it("accepts payloads with debit as a complex expression", () => {
    const result = EventPayloadSchema.safeParse({
      userId: "user_1",
      debit: add(mul(tag("PREMIUM_CALL"), 3), tag("EXTRA_FEE"), 250),
    });

    expect(result.success).toBe(true);
  });

  it("rejects payloads without debit", () => {
    const result = EventPayloadSchema.safeParse({
      userId: "user_1",
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid userId values", () => {
    const result = EventPayloadSchema.safeParse({
      userId: "",
      debit: 2,
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid debit (not a number or PriceExpr)", () => {
    const result = EventPayloadSchema.safeParse({
      userId: "user_1",
      debit: { invalid: "expression" },
    });

    expect(result.success).toBe(false);
  });

  it("rejects debit with invalid nested expression", () => {
    const result = EventPayloadSchema.safeParse({
      userId: "user_1",
      debit: { kind: "amount", value: 2.5 },
    });

    expect(result.success).toBe(false);
  });

  it("rejects negative debit amount", () => {
    const result = EventPayloadSchema.safeParse({
      userId: "user_1",
      debit: -5,
    });

    expect(result.success).toBe(false);
  });

  describe("token placeholder rejection", () => {
    it("rejects debit containing inputTokens()", () => {
      const result = EventPayloadSchema.safeParse({
        userId: "user_1",
        debit: mul(tag("RATE"), inputTokens()),
      });
      expect(result.success).toBe(false);
    });

    it("rejects debit containing outputTokens()", () => {
      const result = EventPayloadSchema.safeParse({
        userId: "user_1",
        debit: mul(tag("RATE"), outputTokens()),
      });
      expect(result.success).toBe(false);
    });

    it("rejects debit with standalone inputTokens()", () => {
      const result = EventPayloadSchema.safeParse({
        userId: "user_1",
        debit: inputTokens(),
      });
      expect(result.success).toBe(false);
    });

    it("rejects debit with standalone outputTokens()", () => {
      const result = EventPayloadSchema.safeParse({
        userId: "user_1",
        debit: outputTokens(),
      });
      expect(result.success).toBe(false);
    });

    it("rejects debit with deeply nested inputTokens()", () => {
      const result = EventPayloadSchema.safeParse({
        userId: "user_1",
        debit: add(100, mul(tag("RATE"), inputTokens())),
      });
      expect(result.success).toBe(false);
    });

    it("rejects debit with both token placeholders", () => {
      const result = EventPayloadSchema.safeParse({
        userId: "user_1",
        debit: add(
          mul(tag("INPUT_RATE"), inputTokens()),
          mul(tag("OUTPUT_RATE"), outputTokens())
        ),
      });
      expect(result.success).toBe(false);
    });

    it("still accepts debit without token placeholders", () => {
      const result = EventPayloadSchema.safeParse({
        userId: "user_1",
        debit: add(mul(tag("PREMIUM_CALL"), 3), tag("EXTRA_FEE"), 250),
      });
      expect(result.success).toBe(true);
    });
  });
});
