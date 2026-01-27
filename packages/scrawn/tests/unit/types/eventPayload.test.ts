import { describe, expect, it } from "vitest";
import { EventPayloadSchema } from "../../../src/core/types/event.js";

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

  it("rejects payloads with both debit fields", () => {
    const result = EventPayloadSchema.safeParse({
      userId: "user_1",
      debitAmount: 5,
      debitTag: "PREMIUM",
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
});
