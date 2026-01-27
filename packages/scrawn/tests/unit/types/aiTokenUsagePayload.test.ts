import { describe, expect, it } from "vitest";
import { AITokenUsagePayloadSchema } from "../../../src/core/types/event.js";
import { mul, tag, add } from "../../../src/core/pricing/index.js";

describe("AITokenUsagePayloadSchema", () => {
  describe("valid payloads", () => {
    it("accepts payloads with amount-based debits", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: 100,
        outputTokens: 50,
        inputDebit: { amount: 0.003 },
        outputDebit: { amount: 0.006 },
      });

      expect(result.success).toBe(true);
    });

    it("accepts payloads with tag-based debits", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "claude-3-opus",
        inputTokens: 200,
        outputTokens: 100,
        inputDebit: { tag: "CLAUDE_INPUT" },
        outputDebit: { tag: "CLAUDE_OUTPUT" },
      });

      expect(result.success).toBe(true);
    });

    it("accepts payloads with expr-based debits", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: 100,
        outputTokens: 50,
        inputDebit: { expr: mul(tag("GPT4_INPUT_RATE"), 100) },
        outputDebit: { expr: mul(tag("GPT4_OUTPUT_RATE"), 50) },
      });

      expect(result.success).toBe(true);
    });

    it("accepts payloads with complex expr-based debits", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: 100,
        outputTokens: 50,
        inputDebit: {
          expr: add(mul(tag("BASE_RATE"), 100), tag("PREMIUM_FEE")),
        },
        outputDebit: { expr: mul(tag("OUTPUT_RATE"), 50) },
      });

      expect(result.success).toBe(true);
    });

    it("accepts payloads with mixed debit types", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: 100,
        outputTokens: 50,
        inputDebit: { amount: 0.003 },
        outputDebit: { tag: "OUTPUT_TAG" },
      });

      expect(result.success).toBe(true);
    });

    it("accepts payloads mixing expr with amount", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: 100,
        outputTokens: 50,
        inputDebit: { expr: mul(tag("INPUT_RATE"), 100) },
        outputDebit: { amount: 6 },
      });

      expect(result.success).toBe(true);
    });

    it("accepts payloads mixing expr with tag", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: 100,
        outputTokens: 50,
        inputDebit: { tag: "INPUT_TAG" },
        outputDebit: { expr: mul(tag("OUTPUT_RATE"), 50) },
      });

      expect(result.success).toBe(true);
    });

    it("accepts payloads with zero tokens", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: 0,
        outputTokens: 0,
        inputDebit: { amount: 0 },
        outputDebit: { amount: 0 },
      });

      expect(result.success).toBe(true);
    });
  });

  describe("invalid payloads", () => {
    it("rejects payloads with empty userId", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "",
        model: "gpt-4",
        inputTokens: 100,
        outputTokens: 50,
        inputDebit: { amount: 0.003 },
        outputDebit: { amount: 0.006 },
      });

      expect(result.success).toBe(false);
    });

    it("rejects payloads with empty model", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "",
        inputTokens: 100,
        outputTokens: 50,
        inputDebit: { amount: 0.003 },
        outputDebit: { amount: 0.006 },
      });

      expect(result.success).toBe(false);
    });

    it("rejects payloads with negative inputTokens", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: -10,
        outputTokens: 50,
        inputDebit: { amount: 0.003 },
        outputDebit: { amount: 0.006 },
      });

      expect(result.success).toBe(false);
    });

    it("rejects payloads with negative outputTokens", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: 100,
        outputTokens: -5,
        inputDebit: { amount: 0.003 },
        outputDebit: { amount: 0.006 },
      });

      expect(result.success).toBe(false);
    });

    it("rejects payloads with non-integer tokens", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: 100.5,
        outputTokens: 50,
        inputDebit: { amount: 0.003 },
        outputDebit: { amount: 0.006 },
      });

      expect(result.success).toBe(false);
    });

    it("rejects payloads with both amount and tag in inputDebit", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: 100,
        outputTokens: 50,
        inputDebit: { amount: 0.003, tag: "INPUT_TAG" },
        outputDebit: { amount: 0.006 },
      });

      expect(result.success).toBe(false);
    });

    it("rejects payloads with both amount and tag in outputDebit", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: 100,
        outputTokens: 50,
        inputDebit: { amount: 0.003 },
        outputDebit: { amount: 0.006, tag: "OUTPUT_TAG" },
      });

      expect(result.success).toBe(false);
    });

    it("rejects payloads with both amount and expr in inputDebit", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: 100,
        outputTokens: 50,
        inputDebit: { amount: 3, expr: tag("INPUT") },
        outputDebit: { amount: 6 },
      });

      expect(result.success).toBe(false);
    });

    it("rejects payloads with both tag and expr in outputDebit", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: 100,
        outputTokens: 50,
        inputDebit: { amount: 3 },
        outputDebit: { tag: "OUTPUT", expr: tag("OUTPUT_EXPR") },
      });

      expect(result.success).toBe(false);
    });

    it("rejects payloads with all three in debit", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: 100,
        outputTokens: 50,
        inputDebit: { amount: 3, tag: "TAG", expr: tag("EXPR") },
        outputDebit: { amount: 6 },
      });

      expect(result.success).toBe(false);
    });

    it("rejects payloads with empty inputDebit", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: 100,
        outputTokens: 50,
        inputDebit: {},
        outputDebit: { amount: 0.006 },
      });

      expect(result.success).toBe(false);
    });

    it("rejects payloads with empty outputDebit", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: 100,
        outputTokens: 50,
        inputDebit: { amount: 0.003 },
        outputDebit: {},
      });

      expect(result.success).toBe(false);
    });

    it("rejects payloads with negative debit amount", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: 100,
        outputTokens: 50,
        inputDebit: { amount: -0.003 },
        outputDebit: { amount: 0.006 },
      });

      expect(result.success).toBe(false);
    });

    it("rejects payloads with empty debit tag", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: 100,
        outputTokens: 50,
        inputDebit: { tag: "" },
        outputDebit: { amount: 0.006 },
      });

      expect(result.success).toBe(false);
    });

    it("rejects payloads with invalid expr", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: 100,
        outputTokens: 50,
        inputDebit: { expr: { invalid: "expression" } },
        outputDebit: { amount: 6 },
      });

      expect(result.success).toBe(false);
    });

    it("rejects payloads missing required fields", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
      });

      expect(result.success).toBe(false);
    });
  });
});
