/**
 * Pricing DSL Serialization
 * 
 * This module converts typed pricing expression ASTs into string format
 * that the backend can parse and evaluate.
 * 
 * Output format examples:
 * - Amount: 250
 * - Tag: tag('PREMIUM_CALL')
 * - Addition: add(100,tag('FEE'),250)
 * - Complex: add(mul(tag('PREMIUM_CALL'),3),tag('EXTRA_FEE'),250)
 * 
 * The format is designed to be:
 * - Unambiguous (parseable by the backend)
 * - Human-readable (for debugging)
 * - Compact (minimal whitespace)
 */

import type { PriceExpr, AmountExpr, TagExpr, OpExpr } from './types.js';

/**
 * Serialize a pricing expression to a string.
 * 
 * @param expr - The expression to serialize
 * @returns A string representation that the backend can parse
 * 
 * @example
 * ```typescript
 * const expr = add(mul(tag('PREMIUM'), 3), 100);
 * const str = serializeExpr(expr);
 * // "add(mul(tag('PREMIUM'),3),100)"
 * ```
 */
export function serializeExpr(expr: PriceExpr): string {
  switch (expr.kind) {
    case 'amount':
      return serializeAmount(expr);
    case 'tag':
      return serializeTag(expr);
    case 'op':
      return serializeOp(expr);
  }
}

/**
 * Serialize an amount expression.
 * Just the integer value.
 */
function serializeAmount(expr: AmountExpr): string {
  return expr.value.toString();
}

/**
 * Serialize a tag expression.
 * Format: tag('TAG_NAME')
 * Uses single quotes for the tag name.
 */
function serializeTag(expr: TagExpr): string {
  // Escape single quotes in tag name (though validation should prevent this)
  const escapedName = expr.name.replace(/'/g, "\\'");
  return `tag('${escapedName}')`;
}

/**
 * Serialize an operation expression.
 * Format: op(arg1,arg2,arg3,...)
 */
function serializeOp(expr: OpExpr): string {
  const opName = expr.op.toLowerCase();
  const args = expr.args.map(serializeExpr).join(',');
  return `${opName}(${args})`;
}

/**
 * Pretty-print a pricing expression with indentation.
 * Useful for debugging and logging.
 * 
 * @param expr - The expression to format
 * @param indent - Number of spaces for indentation (default 2)
 * @returns A formatted, multi-line string representation
 * 
 * @example
 * ```typescript
 * const expr = add(mul(tag('PREMIUM'), 3), 100);
 * console.log(prettyPrintExpr(expr));
 * // add(
 * //   mul(
 * //     tag('PREMIUM'),
 * //     3
 * //   ),
 * //   100
 * // )
 * ```
 */
export function prettyPrintExpr(expr: PriceExpr, indent: number = 2): string {
  return prettyPrintInternal(expr, 0, indent);
}

function prettyPrintInternal(expr: PriceExpr, level: number, indent: number): string {
  const pad = ' '.repeat(level * indent);
  
  switch (expr.kind) {
    case 'amount':
      return expr.value.toString();
    case 'tag':
      return `tag('${expr.name}')`;
    case 'op': {
      const opName = expr.op.toLowerCase();
      if (expr.args.length === 0) {
        return `${opName}()`;
      }
      
      const args = expr.args
        .map(arg => {
          const inner = prettyPrintInternal(arg, level + 1, indent);
          return ' '.repeat((level + 1) * indent) + inner;
        })
        .join(',\n');
      
      return `${opName}(\n${args}\n${pad})`;
    }
  }
}
