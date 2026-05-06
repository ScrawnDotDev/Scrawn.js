/**
 * Token Placeholder Resolution
 *
 * This module provides the resolveTokens() function that replaces
 * inputTokens() / outputTokens() placeholder nodes in a pricing expression
 * with concrete AmountExpr values from an AI token usage payload.
 *
 * Resolution happens SDK-side before serialization, so the backend
 * only sees normal expressions with concrete numbers.
 */

import type { PriceExpr, AmountExpr } from "./types.js";

/**
 * Context for resolving token placeholders.
 * Contains the actual token counts from an AI token usage payload.
 */
export interface TokenContext {
  readonly inputTokens: number;
  readonly outputTokens: number;
}

/**
 * Deeply traverse a PriceExpr tree and replace InputTokensExpr / OutputTokensExpr
 * placeholder nodes with AmountExpr nodes using actual values from the context.
 *
 * Returns a new expression tree with all token placeholders resolved.
 * The original tree is not mutated.
 *
 * @param expr - The expression tree (may contain token placeholders)
 * @param context - The actual inputTokens/outputTokens values
 * @returns A new PriceExpr tree with all token placeholders replaced by AmountExpr nodes
 *
 * @example
 * ```typescript
 * const expr = mul(tag('INPUT_RATE'), inputTokens());
 * const resolved = resolveTokens(expr, { inputTokens: 150, outputTokens: 50 });
 * // resolved is: mul(tag('INPUT_RATE'), 150)
 * ```
 */
export function resolveTokens(expr: PriceExpr, context: TokenContext): PriceExpr {
  switch (expr.kind) {
    case "inputTokens": {
      const resolved: AmountExpr = { kind: "amount", value: context.inputTokens };
      return resolved;
    }
    case "outputTokens": {
      const resolved: AmountExpr = { kind: "amount", value: context.outputTokens };
      return resolved;
    }
    case "op": {
      const resolvedArgs = expr.args.map((arg) => resolveTokens(arg, context));
      return { kind: "op", op: expr.op, args: resolvedArgs };
    }
    case "amount":
    case "tag":
      // These nodes don't contain token placeholders — return as-is
      return expr;
  }
}
