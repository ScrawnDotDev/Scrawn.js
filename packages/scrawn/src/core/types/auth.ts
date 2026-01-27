import type { ApiKeyAuthCreds } from "../auth/apiKeyAuth.js";

/**
 * Registry of all authentication methods and their credential types.
 *
 * When you add a new auth method, add it here:
 * - Key: The auth method name (literal string)
 * - Value: The credential type for that auth method
 *
 * @example
 * ```typescript
 * // Adding OAuth
 * export type AuthRegistry = {
 *   api: ApiKeyAuthCreds;
 *   oauth: OAuthAuthCreds;  // Add new auth types here
 * };
 * ```
 */
export type AuthRegistry = {
  api: ApiKeyAuthCreds;
  // Add new auth methods here as you create them
};

/**
 * Union of all auth method names.
 * Automatically derived from AuthRegistry keys.
 */
export type AuthMethodName = keyof AuthRegistry;

/**
 * Union of all credential types.
 * Automatically derived from AuthRegistry values.
 */
export type AllCredentials = AuthRegistry[keyof AuthRegistry];
