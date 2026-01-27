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
 * Must be a non-empty string with no leading/trailing whitespace.
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
  // Validate tag name format: alphanumeric, underscores, hyphens
  if (!/^[A-Za-z_][A-Za-z0-9_-]*$/.test(name)) {
    throw new PricingExpressionError(
      `Tag name must start with a letter or underscore and contain only ` +
        `alphanumeric characters, underscores, or hyphens: "${name}"`
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
