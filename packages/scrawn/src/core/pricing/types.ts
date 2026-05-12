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
 *
 * @typeParam TTag - The specific tag name literal (defaults to `string` for untyped usage)
 */
export interface TagExpr<TTag extends string = string> {
  readonly kind: "tag";
  readonly name: TTag;
}

/**
 * An arithmetic operation combining multiple expressions.
 *
 * @typeParam TTag - The tag name type flowing through the expression tree
 */
export interface OpExpr<TTag extends string = string> {
  readonly kind: "op";
  readonly op: OpType;
  readonly args: readonly PriceExpr<TTag>[];
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
 *
 * @typeParam TTag - The tag name type flowing through the expression tree
 */
export type PriceExpr<TTag extends string = string> =
  | AmountExpr
  | TagExpr<TTag>
  | OpExpr<TTag>
  | InputTokensExpr
  | OutputTokensExpr;

/**
 * Input type for DSL builder functions.
 * Accepts either a PriceExpr or a raw number (interpreted as cents).
 *
 * @typeParam TTag - The tag name type flowing through the expression tree
 */
export type ExprInput<TTag extends string = string> = PriceExpr<TTag> | number;
