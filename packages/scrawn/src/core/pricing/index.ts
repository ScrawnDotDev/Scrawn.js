/**
 * Pricing DSL Module
 * 
 * Provides a type-safe DSL for building pricing expressions that combine
 * literal amounts, named price tags, and arithmetic operations.
 * 
 * @example
 * ```typescript
 * import { add, mul, tag, serializeExpr } from '@scrawn/core';
 * 
 * // Build expression: (PREMIUM_CALL * 3) + EXTRA_FEE + 250 cents
 * const expr = add(mul(tag('PREMIUM_CALL'), 3), tag('EXTRA_FEE'), 250);
 * 
 * // Serialize for backend: "add(mul(tag('PREMIUM_CALL'),3),tag('EXTRA_FEE'),250)"
 * const exprString = serializeExpr(expr);
 * 
 * // Use in event payload
 * await scrawn.sdkCallEventConsumer({
 *   userId: 'u123',
 *   debitExpr: expr
 * });
 * ```
 */

// Export types
export type {
  OpType,
  AmountExpr,
  TagExpr,
  OpExpr,
  PriceExpr,
  ExprInput,
} from './types.js';

// Export builder functions
export { tag, add, sub, mul, div, amount } from './builders.js';

// Export serialization
export { serializeExpr, prettyPrintExpr } from './serialize.js';

// Export validation
export { validateExpr, isValidExpr, PricingExpressionError } from './validate.js';
