import { AuthBase } from "./baseAuth.js";
import type { Scrawn } from "../scrawn.js";
import { ScrawnLogger } from "../../utils/logger.js";
import { ScrawnValidationError } from "../errors/index.js";

const log = new ScrawnLogger("Auth");

/**
 * API key format: sk_ followed by 16 alphanumeric characters
 * @example 'sk_abc123def456ghi7'
 */
export type ApiKeyFormat = `scrn_${string}`;

/**
 * Type guard to validate API key format
 */
export function isValidApiKey(key: string): key is ApiKeyFormat {
  return /^scrn_[a-zA-Z0-9]{32}$/.test(key);
}

/**
 * Validates and returns a properly typed API key
 * @throws Error if the API key format is invalid
 */
export function validateApiKey(key: string): ApiKeyFormat {
  if (!isValidApiKey(key)) {
    log.error(`Invalid API key format: "${key}".`);
    throw new ScrawnValidationError(
      "Invalid API key format. Expected format: scrn_<32 alphanumeric characters>",
      {
        details: {
          providedKey: key.substring(0, 10) + "...",
          expectedFormat: "scrn_<32 alphanumeric characters>",
        },
      }
    );
  }
  return key;
}

/**
 * Credentials structure for API key authentication.
 */
export type ApiKeyAuthCreds = {
  apiKey: ApiKeyFormat;
};

/**
 * Simple API key authentication method.
 *
 * Provides authentication using a static API key.
 * This is the default authentication method registered by the SDK.
 *
 * @example
 * ```typescript
 * const auth = new ApiKeyAuth('sk_test_...');
 * scrawn.registerAuthMethod('api', auth);
 * ```
 */
export class ApiKeyAuth extends AuthBase<ApiKeyAuthCreds> {
  /** Authentication method identifier */
  name = "api" as const;

  /** Validated API key */
  private validatedKey: ApiKeyFormat;

  /**
   * Creates a new API key authentication instance.
   *
   * @param apiKey - Your Scrawn API key (format: sk_<16 alphanumeric chars>)
   * @throws Error if API key format is invalid
   */
  constructor(apiKey: string) {
    super();
    this.validatedKey = validateApiKey(apiKey);
  }

  /**
   * Initialize the API key auth method.
   * No additional setup is required for API key authentication.
   *
   * @param scrawn - The Scrawn SDK instance (optional, unused)
   */
  async init(scrawn?: Scrawn) {
    // nothing extra for now
    return;
  }

  /**
   * Get the API key credentials.
   *
   * @returns A promise that resolves to an object containing the API key
   *
   * @example
   * ```typescript
   * const creds = await auth.getCreds();
   * // { apiKey: 'sk_abc123def456ghi7' }
   * ```
   */
  async getCreds(): Promise<ApiKeyAuthCreds> {
    return { apiKey: this.validatedKey };
  }
}
