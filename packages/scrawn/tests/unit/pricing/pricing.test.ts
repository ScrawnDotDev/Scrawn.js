import { describe, expect, it } from "vitest";
import {
  tag,
  add,
  sub,
  mul,
  div,
  amount,
  serializeExpr,
  prettyPrintExpr,
  validateExpr,
  isValidExpr,
  PricingExpressionError,
} from "../../../src/core/pricing/index.js";
import type { PriceExpr } from "../../../src/core/pricing/types.js";

describe("Pricing DSL Builders", () => {
  describe("tag()", () => {
    it("creates a tag expression with valid name", () => {
      const expr = tag("PREMIUM_CALL");
      expect(expr).toEqual({ kind: "tag", name: "PREMIUM_CALL" });
    });

    it("accepts underscores and hyphens", () => {
      expect(tag("PREMIUM_CALL")).toEqual({
        kind: "tag",
        name: "PREMIUM_CALL",
      });
      expect(tag("premium-call")).toEqual({
        kind: "tag",
        name: "premium-call",
      });
      expect(tag("_private")).toEqual({ kind: "tag", name: "_private" });
    });

    it("throws on empty tag name", () => {
      expect(() => tag("")).toThrow(PricingExpressionError);
      expect(() => tag("")).toThrow("Tag name cannot be empty");
    });

    it("throws on whitespace-only tag name", () => {
      expect(() => tag("   ")).toThrow(PricingExpressionError);
      expect(() => tag("   ")).toThrow(
        "Tag name cannot have leading or trailing whitespace"
      );
    });

    it("throws on tag name with leading/trailing whitespace", () => {
      expect(() => tag(" PREMIUM")).toThrow(PricingExpressionError);
      expect(() => tag("PREMIUM ")).toThrow(PricingExpressionError);
    });

    it("throws on invalid tag name characters", () => {
      expect(() => tag("123START")).toThrow(PricingExpressionError);
      expect(() => tag("has spaces")).toThrow(PricingExpressionError);
      expect(() => tag("has.dots")).toThrow(PricingExpressionError);
    });
  });

  describe("amount()", () => {
    it("creates an amount expression", () => {
      expect(amount(100)).toEqual({ kind: "amount", value: 100 });
      expect(amount(0)).toEqual({ kind: "amount", value: 0 });
      expect(amount(-50)).toEqual({ kind: "amount", value: -50 });
    });

    it("throws on non-integer values", () => {
      expect(() => amount(2.5)).toThrow(PricingExpressionError);
      expect(() => amount(99.99)).toThrow("Amount must be an integer (cents)");
    });

    it("throws on non-finite values", () => {
      expect(() => amount(Infinity)).toThrow(PricingExpressionError);
      expect(() => amount(-Infinity)).toThrow(PricingExpressionError);
      expect(() => amount(NaN)).toThrow(PricingExpressionError);
    });
  });

  describe("add()", () => {
    it("creates an addition expression", () => {
      const expr = add(100, 200);
      expect(expr.kind).toBe("op");
      expect(expr.op).toBe("ADD");
      expect(expr.args).toHaveLength(2);
    });

    it("auto-wraps numbers as amounts", () => {
      const expr = add(100, tag("FEE"), 50);
      expect(expr.args[0]).toEqual({ kind: "amount", value: 100 });
      expect(expr.args[1]).toEqual({ kind: "tag", name: "FEE" });
      expect(expr.args[2]).toEqual({ kind: "amount", value: 50 });
    });

    it("throws on fewer than 2 arguments", () => {
      expect(() => add(100 as any)).toThrow(PricingExpressionError);
      expect(() => add(100 as any)).toThrow("requires at least 2 arguments");
    });

    it("supports many arguments", () => {
      const expr = add(1, 2, 3, 4, 5);
      expect(expr.args).toHaveLength(5);
    });
  });

  describe("sub()", () => {
    it("creates a subtraction expression", () => {
      const expr = sub(100, 50);
      expect(expr.op).toBe("SUB");
    });

    it("throws on fewer than 2 arguments", () => {
      expect(() => sub(100 as any)).toThrow(PricingExpressionError);
    });
  });

  describe("mul()", () => {
    it("creates a multiplication expression", () => {
      const expr = mul(tag("PER_TOKEN"), 100);
      expect(expr.op).toBe("MUL");
    });

    it("throws on fewer than 2 arguments", () => {
      expect(() => mul(100 as any)).toThrow(PricingExpressionError);
    });
  });

  describe("div()", () => {
    it("creates a division expression", () => {
      const expr = div(tag("TOTAL"), 2);
      expect(expr.op).toBe("DIV");
    });

    it("throws on literal division by zero", () => {
      expect(() => div(100, 0)).toThrow(PricingExpressionError);
      expect(() => div(100, 0)).toThrow("Division by zero");
    });

    it("allows division by tag (backend validates at runtime)", () => {
      // This should NOT throw - backend will handle tag resolution
      const expr = div(100, tag("DIVISOR"));
      expect(expr.op).toBe("DIV");
    });

    it("detects division by zero in any divisor position", () => {
      expect(() => div(100, 2, 0)).toThrow("Division by zero");
      expect(() => div(100, 0, 2)).toThrow("Division by zero");
    });
  });

  describe("nested expressions", () => {
    it("supports deeply nested expressions", () => {
      const expr = add(mul(tag("PREMIUM_CALL"), 3), tag("EXTRA_FEE"), 250);
      expect(expr.kind).toBe("op");
      expect(expr.op).toBe("ADD");
      expect(expr.args).toHaveLength(3);

      const mulExpr = expr.args[0];
      expect(mulExpr.kind).toBe("op");
      if (mulExpr.kind === "op") {
        expect(mulExpr.op).toBe("MUL");
      }
    });

    it("validates nested expressions", () => {
      expect(() => add(mul(tag(""), 3), 100)).toThrow(PricingExpressionError);
    });
  });
});

describe("Pricing DSL Serialization", () => {
  describe("serializeExpr()", () => {
    it("serializes amount expressions", () => {
      expect(serializeExpr(amount(100))).toBe("100");
      expect(serializeExpr(amount(0))).toBe("0");
      expect(serializeExpr(amount(-50))).toBe("-50");
    });

    it("serializes tag expressions", () => {
      expect(serializeExpr(tag("PREMIUM"))).toBe("tag(PREMIUM)");
      expect(serializeExpr(tag("API_CALL"))).toBe("tag(API_CALL)");
    });

    it("serializes simple operations", () => {
      expect(serializeExpr(add(100, 200))).toBe("add(100,200)");
      expect(serializeExpr(sub(100, 50))).toBe("sub(100,50)");
      expect(serializeExpr(mul(10, 5))).toBe("mul(10,5)");
      expect(serializeExpr(div(100, 2))).toBe("div(100,2)");
    });

    it("serializes mixed operations", () => {
      expect(serializeExpr(add(100, tag("FEE")))).toBe("add(100,tag(FEE))");
    });

    it("serializes nested operations", () => {
      const expr = add(mul(tag("PREMIUM_CALL"), 3), tag("EXTRA_FEE"), 250);
      expect(serializeExpr(expr)).toBe(
        "add(mul(tag(PREMIUM_CALL),3),tag(EXTRA_FEE),250)"
      );
    });

    it("serializes complex expressions", () => {
      const expr = div(add(mul(tag("INPUT"), 2), mul(tag("OUTPUT"), 3)), 100);
      expect(serializeExpr(expr)).toBe(
        "div(add(mul(tag(INPUT),2),mul(tag(OUTPUT),3)),100)"
      );
    });
  });

  describe("prettyPrintExpr()", () => {
    it("pretty prints simple expressions", () => {
      expect(prettyPrintExpr(amount(100))).toBe("100");
      expect(prettyPrintExpr(tag("PREMIUM"))).toBe("tag(PREMIUM)");
    });

    it("pretty prints operations with indentation", () => {
      const expr = add(100, 200);
      const output = prettyPrintExpr(expr);
      expect(output).toContain("add(");
      expect(output).toContain("100");
      expect(output).toContain("200");
    });
  });
});

describe("Pricing DSL Validation", () => {
  describe("validateExpr()", () => {
    it("validates amount expressions", () => {
      expect(() => validateExpr(amount(100))).not.toThrow();
      expect(() =>
        validateExpr({ kind: "amount", value: 2.5 } as PriceExpr)
      ).toThrow();
    });

    it("validates tag expressions", () => {
      expect(() => validateExpr(tag("VALID"))).not.toThrow();
      expect(() =>
        validateExpr({ kind: "tag", name: "" } as PriceExpr)
      ).toThrow();
    });

    it("validates operation expressions", () => {
      expect(() => validateExpr(add(100, 200))).not.toThrow();
      expect(() =>
        validateExpr({
          kind: "op",
          op: "ADD",
          args: [amount(100)],
        } as PriceExpr)
      ).toThrow();
    });
  });

  describe("isValidExpr()", () => {
    it("returns true for valid expressions", () => {
      expect(isValidExpr(amount(100))).toBe(true);
      expect(isValidExpr(tag("PREMIUM"))).toBe(true);
      expect(isValidExpr(add(100, 200))).toBe(true);
    });

    it("returns false for invalid expressions", () => {
      expect(isValidExpr({ kind: "amount", value: 2.5 } as PriceExpr)).toBe(
        false
      );
      expect(isValidExpr({ kind: "tag", name: "" } as PriceExpr)).toBe(false);
    });
  });
});

describe("Integration Examples", () => {
  it("handles typical billing expression", () => {
    // (PREMIUM_CALL * 3) + EXTRA_FEE + 250 cents
    const expr = add(mul(tag("PREMIUM_CALL"), 3), tag("EXTRA_FEE"), 250);
    const serialized = serializeExpr(expr);
    expect(serialized).toBe("add(mul(tag(PREMIUM_CALL),3),tag(EXTRA_FEE),250)");
  });

  it("handles per-token pricing", () => {
    // (INPUT_TOKENS * INPUT_RATE) + (OUTPUT_TOKENS * OUTPUT_RATE)
    const expr = add(
      mul(tag("INPUT_TOKENS"), tag("INPUT_RATE")),
      mul(tag("OUTPUT_TOKENS"), tag("OUTPUT_RATE"))
    );
    const serialized = serializeExpr(expr);
    expect(serialized).toBe(
      "add(mul(tag(INPUT_TOKENS),tag(INPUT_RATE)),mul(tag(OUTPUT_TOKENS),tag(OUTPUT_RATE)))"
    );
  });

  it("handles discount calculation", () => {
    // SUBTOTAL - (SUBTOTAL * DISCOUNT_PERCENT / 100)
    const expr = sub(
      tag("SUBTOTAL"),
      div(mul(tag("SUBTOTAL"), tag("DISCOUNT_PERCENT")), 100)
    );
    const serialized = serializeExpr(expr);
    expect(serialized).toBe(
      "sub(tag(SUBTOTAL),div(mul(tag(SUBTOTAL),tag(DISCOUNT_PERCENT)),100))"
    );
  });
});
