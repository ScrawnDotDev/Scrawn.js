/**
 * Pricing DSL Builder Functions
 * 
 * This module provides the fluent builder functions for constructing
 * type-safe pricing expressions. These functions perform light validation
 * and build the AST that gets serialized to a string for the backend.
 * 
 * @example
 * ```typescript
 * import { add, mul, tag } from '@scrawn/core';
 * 
 * // (PREMIUM_CALL * 3) + EXTRA_FEE + 250 cents
 * const expr = add(mul(tag('PREMIUM_CALL'), 3), tag('EXTRA_FEE'), 250);
 * ```
 */

import type { AmountExpr, TagExpr, OpExpr, PriceExpr, ExprInput } from './types.js';
import { validateExpr } from './validate.js';

/**
 * Convert an ExprInput (PriceExpr or number) to a PriceExpr.
 * Numbers are wrapped as AmountExpr (cents).
 */
function toExpr(input: ExprInput): PriceExpr {
  if (typeof input === 'number') {
    return { kind: 'amount', value: input } as const;
  }
  return input;
}

/**
 * Create a tag reference expression.
 * Tags are resolved to their cent values by the backend.
 * 
 * @param name - The name of the price tag (must be non-empty)
 * @returns A TagExpr referencing the named tag
 * @throws Error if name is empty or whitespace-only
 * 
 * @example
 * ```typescript
 * const premiumTag = tag('PREMIUM_CALL');
 * ```
 */
export function tag(name: string): TagExpr {
  const expr: TagExpr = { kind: 'tag', name } as const;
  validateExpr(expr); // Will throw if invalid
  return expr;
}

/**
 * Create an addition expression.
 * Adds all arguments together: arg1 + arg2 + arg3 + ...
 * 
 * @param args - Two or more expressions or numbers (cents) to add
 * @returns An OpExpr representing the sum
 * @throws Error if fewer than 2 arguments provided
 * 
 * @example
 * ```typescript
 * // 100 + 200 + tag('BONUS')
 * const sum = add(100, 200, tag('BONUS'));
 * ```
 */
export function add(...args: ExprInput[]): OpExpr {
  const expr: OpExpr = {
    kind: 'op',
    op: 'ADD',
    args: args.map(toExpr),
  } as const;
  validateExpr(expr);
  return expr;
}

/**
 * Create a subtraction expression.
 * Subtracts subsequent arguments from the first: arg1 - arg2 - arg3 - ...
 * 
 * @param args - Two or more expressions or numbers (cents) to subtract
 * @returns An OpExpr representing the difference
 * @throws Error if fewer than 2 arguments provided
 * 
 * @example
 * ```typescript
 * // tag('TOTAL') - 50
 * const diff = sub(tag('TOTAL'), 50);
 * ```
 */
export function sub(...args: ExprInput[]): OpExpr {
  const expr: OpExpr = {
    kind: 'op',
    op: 'SUB',
    args: args.map(toExpr),
  } as const;
  validateExpr(expr);
  return expr;
}

/**
 * Create a multiplication expression.
 * Multiplies all arguments together: arg1 * arg2 * arg3 * ...
 * 
 * @param args - Two or more expressions or numbers (cents) to multiply
 * @returns An OpExpr representing the product
 * @throws Error if fewer than 2 arguments provided
 * 
 * @example
 * ```typescript
 * // tag('PER_TOKEN') * 100
 * const product = mul(tag('PER_TOKEN'), 100);
 * ```
 */
export function mul(...args: ExprInput[]): OpExpr {
  const expr: OpExpr = {
    kind: 'op',
    op: 'MUL',
    args: args.map(toExpr),
  } as const;
  validateExpr(expr);
  return expr;
}

/**
 * Create a division expression.
 * Divides the first argument by subsequent arguments: arg1 / arg2 / arg3 / ...
 * 
 * Note: The backend performs integer division. Results are truncated, not rounded.
 * 
 * @param args - Two or more expressions or numbers (cents) to divide
 * @returns An OpExpr representing the quotient
 * @throws Error if fewer than 2 arguments provided
 * @throws Error if any literal divisor is 0 (detected at build time)
 * 
 * @example
 * ```typescript
 * // tag('TOTAL') / 2
 * const half = div(tag('TOTAL'), 2);
 * ```
 */
export function div(...args: ExprInput[]): OpExpr {
  const expr: OpExpr = {
    kind: 'op',
    op: 'DIV',
    args: args.map(toExpr),
  } as const;
  validateExpr(expr);
  return expr;
}

/**
 * Create an amount expression from a number of cents.
 * This is useful when you need to explicitly create an AmountExpr
 * rather than relying on auto-conversion.
 * 
 * @param cents - The amount in cents (must be an integer)
 * @returns An AmountExpr representing the amount
 * @throws Error if cents is not a finite integer
 * 
 * @example
 * ```typescript
 * const fee = amount(250); // 250 cents = $2.50
 * ```
 */
export function amount(cents: number): AmountExpr {
  const expr: AmountExpr = { kind: 'amount', value: cents } as const;
  validateExpr(expr);
  return expr;
}
