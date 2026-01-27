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
export type OpType = 'ADD' | 'SUB' | 'MUL' | 'DIV';

/**
 * A literal amount in cents (must be an integer).
 */
export interface AmountExpr {
  readonly kind: 'amount';
  readonly value: number;
}

/**
 * A reference to a named price tag (resolved by the backend).
 */
export interface TagExpr {
  readonly kind: 'tag';
  readonly name: string;
}

/**
 * An arithmetic operation combining multiple expressions.
 */
export interface OpExpr {
  readonly kind: 'op';
  readonly op: OpType;
  readonly args: readonly PriceExpr[];
}

/**
 * A pricing expression - can be a literal amount, a tag reference, or an operation.
 */
export type PriceExpr = AmountExpr | TagExpr | OpExpr;

/**
 * Input type for DSL builder functions.
 * Accepts either a PriceExpr or a raw number (interpreted as cents).
 */
export type ExprInput = PriceExpr | number;
