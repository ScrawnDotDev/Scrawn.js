import { AuthBase } from "./baseAuth.js";
import { ScrawnLogger } from "../../utils/logger.js";
import { ScrawnValidationError } from "../errors/index.js";

const log = new ScrawnLogger("Auth");

/**
 * API key format: scrn_<role>_ followed by 32 alphanumeric characters.
 * Roles: dash (dashboard), live (production), test
 * @example 'scrn_live_abc123def456ghi789jkl012mno345pq'
 */
export type ApiKeyFormat = `scrn_${string}`;

const API_KEY_REGEX = /^scrn_(dash|live|test)_[a-zA-Z0-9]{32}$/;

/**
 * Type guard to validate API key format
 */
export function isValidApiKey(key: string): key is ApiKeyFormat {
  return API_KEY_REGEX.test(key);
}

/**
 * Validates and returns a properly typed API key
 * @throws Error if the API key format is invalid
 */
export function validateApiKey(key: string): ApiKeyFormat {
  if (!isValidApiKey(key)) {
    log.error(`Invalid API key format: "${key}".`);
    throw new ScrawnValidationError(
      "Invalid API key format. Expected format: scrn_<dash|live|test>_<32 alphanumeric characters>",
      {
        details: {
          providedKey: key.substring(0, 14) + "...",
          expectedFormat: "scrn_<role>_<32 alphanumeric characters>",
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
