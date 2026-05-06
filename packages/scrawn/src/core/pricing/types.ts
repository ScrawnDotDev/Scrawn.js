/**
 * Pricing DSL Types
 *
 * This module defines the type-safe AST for pricing expressions.
 * The SDK builds typed expressions using these types, then serializes
 * them to strings for the backend to parse and evaluate.
 *
 * @example
 * ```typescript
 * import { add, mul, tag } from '@scrawn/core';
 *
 * // Build a pricing expression: (PREMIUM_CALL * 3) + EXTRA_FEE + 250 cents
 * const expr = add(mul(tag('PREMIUM_CALL'), 3), tag('EXTRA_FEE'), 250);
 * ```
 */

/**
 * Supported arithmetic operations for pricing expressions.
 */
export type OpType = "ADD" | "SUB" | "MUL" | "DIV";

/**
 * Intellisense hint type for tag names.
 * Tag names must be ALL CAPS with underscores only (e.g., PREMIUM_CALL, FEE, INPUT_RATE).
 * No lowercase, digits, or hyphens allowed.
 *
 * This is a branded type that provides IDE hints while remaining compatible with `string`.
 */
export type TagName = Uppercase<string> & { readonly __brand?: "TagName" };

/**
 * A literal amount in cents (must be an integer).
 */
export interface AmountExpr {
  readonly kind: "amount";
  readonly value: number;
}

/**
 * A reference to a named price tag (resolved by the backend).
 * Tag names must be ALL CAPS with underscores only (e.g., PREMIUM_CALL, FEE).
 */
export interface TagExpr {
  readonly kind: "tag";
  readonly name: TagName;
}

/**
 * An arithmetic operation combining multiple expressions.
 */
export interface OpExpr {
  readonly kind: "op";
  readonly op: OpType;
  readonly args: readonly PriceExpr[];
}

/**
 * A placeholder for the inputTokens value from an AI token usage payload.
 * Only valid in expressions used with aiTokenStreamConsumer.
 * Resolved SDK-side to an AmountExpr before serialization.
 */
export interface InputTokensExpr {
  readonly kind: "inputTokens";
}

/**
 * A placeholder for the outputTokens value from an AI token usage payload.
 * Only valid in expressions used with aiTokenStreamConsumer.
 * Resolved SDK-side to an AmountExpr before serialization.
 */
export interface OutputTokensExpr {
  readonly kind: "outputTokens";
}

/**
 * A pricing expression - can be a literal amount, a tag reference, an operation,
 * or a token placeholder (inputTokens/outputTokens).
 */
export type PriceExpr =
  | AmountExpr
  | TagExpr
  | OpExpr
  | InputTokensExpr
  | OutputTokensExpr;

/**
 * Input type for DSL builder functions.
 * Accepts either a PriceExpr or a raw number (interpreted as cents).
 */
export type ExprInput = PriceExpr | number;
