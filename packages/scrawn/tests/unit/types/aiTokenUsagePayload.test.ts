import { describe, expect, it } from "vitest";
import { AITokenUsagePayloadSchema } from "../../../src/core/types/event.js";
import {
  mul,
  tag,
  add,
  inputTokens,
  outputTokens,
} from "../../../src/core/pricing/index.js";

describe("AITokenUsagePayloadSchema", () => {
  describe("valid payloads", () => {
    it("accepts payloads with amount-based debits", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: 100,
        outputTokens: 50,
        inputDebit: 3,
        outputDebit: 6,
      });

      expect(result.success).toBe(true);
    });

    it("accepts payloads with tag-based debits", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "claude-3-opus",
        inputTokens: 200,
        outputTokens: 100,
        inputDebit: tag("CLAUDE_INPUT"),
        outputDebit: tag("CLAUDE_OUTPUT"),
      });

      expect(result.success).toBe(true);
    });

    it("accepts payloads with expr-based debits", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: 100,
        outputTokens: 50,
        inputDebit: mul(tag("GPT_INPUT_RATE"), 100),
        outputDebit: mul(tag("GPT_OUTPUT_RATE"), 50),
      });

      expect(result.success).toBe(true);
    });

    it("accepts payloads with complex expr-based debits", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: 100,
        outputTokens: 50,
        inputDebit: add(mul(tag("BASE_RATE"), 100), tag("PREMIUM_FEE")),
        outputDebit: mul(tag("OUTPUT_RATE"), 50),
      });

      expect(result.success).toBe(true);
    });

    it("accepts payloads with mixed debit types", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: 100,
        outputTokens: 50,
        inputDebit: 3,
        outputDebit: tag("OUTPUT_TAG"),
      });

      expect(result.success).toBe(true);
    });

    it("accepts payloads with zero tokens", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: 0,
        outputTokens: 0,
        inputDebit: 0,
        outputDebit: 0,
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
        inputDebit: 3,
        outputDebit: 6,
      });

      expect(result.success).toBe(false);
    });

    it("rejects payloads with empty model", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "",
        inputTokens: 100,
        outputTokens: 50,
        inputDebit: 3,
        outputDebit: 6,
      });

      expect(result.success).toBe(false);
    });

    it("rejects payloads with negative inputTokens", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: -10,
        outputTokens: 50,
        inputDebit: 3,
        outputDebit: 6,
      });

      expect(result.success).toBe(false);
    });

    it("rejects payloads with negative outputTokens", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: 100,
        outputTokens: -5,
        inputDebit: 3,
        outputDebit: 6,
      });

      expect(result.success).toBe(false);
    });

    it("rejects payloads with non-integer tokens", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: 100.5,
        outputTokens: 50,
        inputDebit: 3,
        outputDebit: 6,
      });

      expect(result.success).toBe(false);
    });

    it("rejects payloads with invalid expr", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: 100,
        outputTokens: 50,
        inputDebit: { invalid: "expression" },
        outputDebit: 6,
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

    it("rejects payloads with missing debit", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: 100,
        outputTokens: 50,
        inputDebit: 3,
      });

      expect(result.success).toBe(false);
    });

    it("rejects negative debit", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: 100,
        outputTokens: 50,
        inputDebit: -3,
        outputDebit: 6,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("token placeholder expressions", () => {
    it("accepts inputTokens() in inputDebit expr", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: 100,
        outputTokens: 50,
        inputDebit: mul(tag("INPUT_RATE"), inputTokens()),
        outputDebit: 6,
      });
      expect(result.success).toBe(true);
    });

    it("accepts outputTokens() in outputDebit expr", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: 100,
        outputTokens: 50,
        inputDebit: 3,
        outputDebit: mul(tag("OUTPUT_RATE"), outputTokens()),
      });
      expect(result.success).toBe(true);
    });

    it("accepts both token placeholders in different debits", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: 100,
        outputTokens: 50,
        inputDebit: mul(tag("INPUT_RATE"), inputTokens()),
        outputDebit: mul(tag("OUTPUT_RATE"), outputTokens()),
      });
      expect(result.success).toBe(true);
    });

    it("accepts complex expressions with token placeholders", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: 100,
        outputTokens: 50,
        inputDebit: add(
          mul(tag("BASE_RATE"), inputTokens()),
          tag("PREMIUM_FEE")
        ),
        outputDebit: mul(tag("OUTPUT_RATE"), outputTokens()),
      });
      expect(result.success).toBe(true);
    });

    it("accepts standalone inputTokens() as debit", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: 100,
        outputTokens: 50,
        inputDebit: inputTokens(),
        outputDebit: 6,
      });
      expect(result.success).toBe(true);
    });

    it("accepts standalone outputTokens() as debit", () => {
      const result = AITokenUsagePayloadSchema.safeParse({
        userId: "user_1",
        model: "gpt-4",
        inputTokens: 100,
        outputTokens: 50,
        inputDebit: 3,
        outputDebit: outputTokens(),
      });
      expect(result.success).toBe(true);
    });
  });
});
