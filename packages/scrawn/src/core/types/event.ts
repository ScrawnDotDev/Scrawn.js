import { z } from 'zod';
import type { PriceExpr } from '../pricing/types.js';
import { isValidExpr } from '../pricing/validate.js';

/**
 * Custom zod schema for PriceExpr validation.
 * Validates that the value is a valid pricing expression AST.
 */
const PriceExprSchema = z.custom<PriceExpr>(
    (val): val is PriceExpr => {
        if (val === null || val === undefined || typeof val !== 'object') {
            return false;
        }
        const expr = val as PriceExpr;
        // Check that it has a valid kind
        if (expr.kind !== 'amount' && expr.kind !== 'tag' && expr.kind !== 'op') {
            return false;
        }
        // Use the validation function
        return isValidExpr(expr);
    },
    { message: 'Must be a valid pricing expression (use tag(), add(), sub(), mul(), div(), or amount())' }
);

/**
 * Zod schema for event payload validation.
 * 
 * Used by all event consumer methods to ensure consistent validation.
 * 
 * Validates:
 * - userId: non-empty string
 * - Exactly one of: debitAmount (number), debitTag (string), or debitExpr (PriceExpr)
 */
export const EventPayloadSchema = z.object({
    userId: z.string().min(1, 'userId must be a non-empty string'),
    debitAmount: z.number().positive('debitAmount must be a positive number').optional(),
    debitTag: z.string().min(1, 'debitTag must be a non-empty string').optional(),
    debitExpr: PriceExprSchema.optional(),
}).refine(
    (data) => {
        const defined = [
            data.debitAmount !== undefined,
            data.debitTag !== undefined,
            data.debitExpr !== undefined,
        ].filter(Boolean).length;
        return defined === 1;
    },
    { message: 'Exactly one of debitAmount, debitTag, or debitExpr must be provided' }
);

/**
 * Payload structure for event tracking.
 * 
 * Used by both sdkCallEventConsumer and middlewareEventConsumer.
 * 
 * @property userId - The user ID associated with this event
 * @property debitAmount - (Optional) Direct amount to debit in cents
 * @property debitTag - (Optional) Named price tag to look up amount from backend
 * @property debitExpr - (Optional) Pricing expression for complex calculations
 * 
 * Note: Exactly one of debitAmount, debitTag, or debitExpr must be provided.
 * 
 * @example
 * ```typescript
 * import { add, mul, tag } from '@scrawn/core';
 * 
 * // Using direct amount
 * const payload1: EventPayload = {
 *   userId: 'u123',
 *   debitAmount: 500  // 500 cents = $5.00
 * };
 * 
 * // Using price tag
 * const payload2: EventPayload = {
 *   userId: 'u123',
 *   debitTag: 'PREMIUM_FEATURE'
 * };
 * 
 * // Using pricing expression
 * const payload3: EventPayload = {
 *   userId: 'u123',
 *   debitExpr: add(mul(tag('PREMIUM_CALL'), 3), tag('EXTRA_FEE'), 250)
 * };
 * ```
 */
export type EventPayload = z.infer<typeof EventPayloadSchema>;

/**
 * Generic request object type for middleware compatibility.
 * Supports Express, Fastify, and other Node.js frameworks.
 */
export interface MiddlewareRequest {
    /** HTTP method (GET, POST, etc.) */
    method?: string;
    /** Request URL path */
    url?: string;
    /** Request path (alternative to url) */
    path?: string;
    /** Request body */
    body?: any;
    /** Request headers */
    headers?: Record<string, string | string[] | undefined>;
    /** Request query parameters */
    query?: Record<string, any>;
    /** Request params (route parameters) */
    params?: Record<string, any>;
    /** Any additional custom properties */
    [key: string]: any;
}

/**
 * Generic response object type for middleware compatibility.
 */
export interface MiddlewareResponse {
    /** Status code setter */
    status?: (code: number) => MiddlewareResponse;
    /** JSON response sender */
    json?: (data: any) => void;
    /** Send response */
    send?: (data: any) => void;
    /** Any additional custom properties */
    [key: string]: any;
}

/**
 * Generic next function type for middleware compatibility.
 */
export type MiddlewareNext = (error?: any) => void;

/**
 * Extractor function that derives userId and debit info from a request.
 * 
 * @param req - The incoming request object
 * @returns An object containing userId and either debitAmount or debitTag, a Promise resolving to it, or null to skip tracking
 * 
 * @example
 * ```typescript
 * // Using direct amount
 * const extractor: PayloadExtractor = (req) => ({
 *   userId: req.headers['x-user-id'] as string,
 *   debitAmount: 1
 * });
 * 
 * // Using price tag
 * const extractor: PayloadExtractor = (req) => ({
 *   userId: req.user.id,
 *   debitTag: 'STANDARD_API_CALL'
 * });
 * 
 * // Dynamic tag based on route
 * const extractor: PayloadExtractor = (req) => {
 *   if (req.path === '/health') return null;
 *   return { 
 *     userId: req.user.id, 
 *     debitTag: req.path.startsWith('/premium') ? 'PREMIUM_API' : 'STANDARD_API'
 *   };
 * };
 * ```
 */
export type PayloadExtractor = (
    req: MiddlewareRequest
) => EventPayload | Promise<EventPayload> | null | Promise<null>;

/**
 * Configuration options for the Express middleware event consumer.
 * 
 * @property extractor - Function to extract userId and debit info from request. Return null to skip tracking.
 * @property whitelist - Optional array of endpoint patterns to track. Supports wildcards (* for single segment, ** for multiple segments). Takes precedence over blacklist.
 * @property blacklist - Optional array of endpoint patterns to exclude from tracking. Same wildcard support as whitelist. Only applies to endpoints not in whitelist.
 * 
 * @example
 * ```typescript
 * // Using direct amounts
 * const config1: MiddlewareEventConfig = {
 *   extractor: (req) => ({
 *     userId: req.user?.id,
 *     debitAmount: calculateCost(req)
 *   }),
 *   whitelist: ['/api/expensive-operation', '/api/premium-feature'],
 *   blacklist: ['/api/health']
 * };
 * 
 * // Using price tags
 * const config2: MiddlewareEventConfig = {
 *   extractor: (req) => ({
 *     userId: req.user?.id,
 *     debitTag: req.path.startsWith('/premium') ? 'PREMIUM_API' : 'STANDARD_API'
 *   }),
 *   whitelist: ['/api/**'],
 *   blacklist: ['**.tmp']
 * };
 * ```
 */
export interface MiddlewareEventConfig {
    /** Function to extract event payload from request. Return null to skip tracking. */
    extractor: PayloadExtractor;
    /** Optional patterns to track (exact match or wildcards: * for single segment, ** for multi-segment). Takes precedence over blacklist. */
    whitelist?: string[];
    /** Optional patterns to exclude (exact match or wildcards: * for single segment, ** for multi-segment). Only applies to endpoints not in whitelist. */
    blacklist?: string[];
}

/**
 * Debit field schema for AI token usage.
 * 
 * Represents a direct amount, a named price tag, or a pricing expression for billing.
 * Exactly one of amount, tag, or expr must be provided.
 */
const DebitFieldSchema = z.object({
    amount: z.number().nonnegative('amount must be non-negative').optional(),
    tag: z.string().min(1, 'tag must be a non-empty string').optional(),
    expr: PriceExprSchema.optional(),
}).refine(
    (data) => {
        const defined = [
            data.amount !== undefined,
            data.tag !== undefined,
            data.expr !== undefined,
        ].filter(Boolean).length;
        return defined === 1;
    },
    { message: 'Exactly one of amount, tag, or expr must be provided' }
);

/**
 * Zod schema for AI token usage payload validation.
 * 
 * Used by aiTokenStreamConsumer to validate each token usage event.
 * 
 * Validates:
 * - userId: non-empty string
 * - model: non-empty string (e.g., 'gpt-4', 'claude-3')
 * - inputTokens: non-negative integer
 * - outputTokens: non-negative integer
 * - inputDebit: exactly one of amount (number), tag (string), or expr (PriceExpr)
 * - outputDebit: exactly one of amount (number), tag (string), or expr (PriceExpr)
 */
export const AITokenUsagePayloadSchema = z.object({
    userId: z.string().min(1, 'userId must be a non-empty string'),
    model: z.string().min(1, 'model must be a non-empty string'),
    inputTokens: z.number().int('inputTokens must be an integer').nonnegative('inputTokens must be non-negative'),
    outputTokens: z.number().int('outputTokens must be an integer').nonnegative('outputTokens must be non-negative'),
    inputDebit: DebitFieldSchema,
    outputDebit: DebitFieldSchema,
});

/**
 * Payload structure for AI token usage tracking.
 * 
 * Used by aiTokenStreamConsumer to track AI model token consumption.
 * Each payload represents a single usage event (e.g., one chunk or one request).
 * 
 * @property userId - The user ID associated with this token usage
 * @property model - The AI model identifier (e.g., 'gpt-4', 'claude-3-opus')
 * @property inputTokens - Number of input/prompt tokens consumed
 * @property outputTokens - Number of output/completion tokens consumed
 * @property inputDebit - Billing info for input tokens (amount, tag, or expr)
 * @property outputDebit - Billing info for output tokens (amount, tag, or expr)
 * 
 * @example
 * ```typescript
 * import { mul, tag } from '@scrawn/core';
 * 
 * // Using direct amounts
 * const payload1: AITokenUsagePayload = {
 *   userId: 'u123',
 *   model: 'gpt-4',
 *   inputTokens: 100,
 *   outputTokens: 50,
 *   inputDebit: { amount: 3 },  // 3 cents
 *   outputDebit: { amount: 6 }  // 6 cents
 * };
 * 
 * // Using price tags
 * const payload2: AITokenUsagePayload = {
 *   userId: 'u123',
 *   model: 'claude-3-opus',
 *   inputTokens: 200,
 *   outputTokens: 100,
 *   inputDebit: { tag: 'CLAUDE_INPUT' },
 *   outputDebit: { tag: 'CLAUDE_OUTPUT' }
 * };
 * 
 * // Using pricing expressions (e.g., per-token pricing)
 * const payload3: AITokenUsagePayload = {
 *   userId: 'u123',
 *   model: 'gpt-4',
 *   inputTokens: 100,
 *   outputTokens: 50,
 *   inputDebit: { expr: mul(tag('GPT4_INPUT_RATE'), 100) },   // rate * tokens
 *   outputDebit: { expr: mul(tag('GPT4_OUTPUT_RATE'), 50) }   // rate * tokens
 * };
 * ```
 */
export type AITokenUsagePayload = z.infer<typeof AITokenUsagePayloadSchema>;
