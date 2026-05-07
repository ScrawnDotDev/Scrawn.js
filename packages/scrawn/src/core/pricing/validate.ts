/**
 * Pricing DSL Validation
 *
 * This module provides light SDK-side validation for pricing expressions.
 * The backend performs full validation; the SDK only catches obvious errors
 * early to provide better developer experience.
 *
 * SDK validates:
 * - Division by literal zero
 * - Non-integer cents (amounts must be integers)
 * - Non-finite numbers (NaN, Infinity)
 * - Empty operation arguments (ops need at least 2 args)
 * - Empty/whitespace tag names
 * - Tag name format (must be ALL_CAPS with underscores only)
 *
 * SDK does NOT validate:
 * - Tag existence (backend resolves tags)
 * - Division by zero when divisor is a tag (backend handles)
 * - Overflow (backend handles)
 * - Negative results (backend handles)
 */

import type { PriceExpr, OpExpr } from "./types.js";

/**
 * Error thrown when a pricing expression fails validation.
 */
export class PricingExpressionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PricingExpressionError";
  }
}

/**
 * Validate a pricing expression.
 * Throws PricingExpressionError if validation fails.
 *
 * @param expr - The expression to validate
 * @throws PricingExpressionError if validation fails
 */
export function validateExpr(expr: PriceExpr): void {
  switch (expr.kind) {
    case "amount":
      validateAmount(expr.value);
      break;
    case "tag":
      validateTagName(expr.name);
      break;
    case "op":
      validateOp(expr);
      break;
    case "inputTokens":
    case "outputTokens":
      // Token placeholders are valid AST nodes — no validation needed.
      // Context-level validation (e.g., rejecting them in SDK call payloads)
      // is handled in event.ts, not here.
      break;
  }
}

/**
 * Validate an amount value.
 * Must be a finite integer.
 */
function validateAmount(value: number): void {
  if (!Number.isFinite(value)) {
    throw new PricingExpressionError(
      `Amount must be a finite number, got: ${value}`
    );
  }
  if (!Number.isInteger(value)) {
    throw new PricingExpressionError(
      `Amount must be an integer (cents), got: ${value}. ` +
        `Hint: Use cents instead of dollars (e.g., 250 instead of 2.50)`
    );
  }
}

/**
 * Validate a tag name.
 * Must be ALL CAPS with underscores only (e.g., PREMIUM_CALL, FEE, INPUT_RATE).
 * No lowercase, digits, or hyphens allowed.
 */
function validateTagName(name: string): void {
  if (typeof name !== "string") {
    throw new PricingExpressionError(
      `Tag name must be a string, got: ${typeof name}`
    );
  }
  if (name.length === 0) {
    throw new PricingExpressionError("Tag name cannot be empty");
  }
  if (name.trim() !== name) {
    throw new PricingExpressionError(
      `Tag name cannot have leading or trailing whitespace: "${name}"`
    );
  }
  if (name.trim().length === 0) {
    throw new PricingExpressionError("Tag name cannot be only whitespace");
  }
  // Validate tag name format: ALL CAPS with underscores only
  if (!/^[A-Z_]+$/.test(name)) {
    throw new PricingExpressionError(
      `Tag name must be ALL CAPS with underscores only (e.g., PREMIUM_CALL, FEE). ` +
        `No lowercase, digits, or hyphens allowed. Got: "${name}"`
    );
  }
}

/**
 * Validate an operation expression.
 * Must have at least 2 arguments.
 * For division, checks for literal zero divisors.
 */
function validateOp(expr: OpExpr): void {
  const { op, args } = expr;

  // Must have at least 2 arguments
  if (args.length < 2) {
    throw new PricingExpressionError(
      `Operation ${op.toLowerCase()} requires at least 2 arguments, got: ${args.length}`
    );
  }

  // Recursively validate all arguments
  for (const arg of args) {
    validateExpr(arg);
  }

  // Check for division by literal zero
  if (op === "DIV") {
    // Check all divisors (all args after the first)
    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      if (arg.kind === "amount" && arg.value === 0) {
        throw new PricingExpressionError(
          `Division by zero: divisor at position ${i + 1} is 0`
        );
      }
    }
  }
}

/**
 * Check if an expression is valid without throwing.
 * Returns true if valid, false otherwise.
 *
 * @param expr - The expression to check
 * @returns true if the expression is valid
 */
export function isValidExpr(expr: PriceExpr): boolean {
  try {
    validateExpr(expr);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if an expression tree contains any token placeholder nodes
 * (inputTokens or outputTokens).
 *
 * Used to reject token placeholders in contexts where they are not valid
 * (e.g., SDK call event payloads).
 *
 * @param expr - The expression to check
 * @returns true if the expression contains any token placeholders
 */
export function containsTokenExpr(expr: PriceExpr): boolean {
  switch (expr.kind) {
    case "inputTokens":
    case "outputTokens":
      return true;
    case "op":
      return expr.args.some(containsTokenExpr);
    case "amount":
    case "tag":
      return false;
  }
}
