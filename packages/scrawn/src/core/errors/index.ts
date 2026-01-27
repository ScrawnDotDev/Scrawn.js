/**
 * Comprehensive error handling system for the Scrawn SDK.
 *
 * Provides structured error classes with rich metadata for better debugging
 * and error handling by SDK consumers.
 *
 * @example
 * ```typescript
 * try {
 *   await scrawn.sdkCallEventConsumer({ ... });
 * } catch (error) {
 *   if (error instanceof ScrawnAuthenticationError) {
 *     console.error('Auth failed:', error.message);
 *     // Refresh API key
 *   } else if (error instanceof ScrawnNetworkError && error.retryable) {
 *     // Retry the request
 *   }
 * }
 * ```
 */

/**
 * Base error class for all Scrawn SDK errors.
 * Extends native Error with additional metadata fields.
 */
export class ScrawnError extends Error {
  /** Error code for programmatic error handling */
  public readonly code: string;

  /** Whether this error is retryable */
  public readonly retryable: boolean;

  /** HTTP status code if applicable */
  public readonly statusCode?: number;

  /** Request ID for debugging (if available) */
  public readonly requestId?: string;

  /** Additional error details */
  public readonly details?: Record<string, any>;

  /** Original error that caused this error (if any) */
  public readonly cause?: Error;

  constructor(
    message: string,
    options: {
      code: string;
      retryable?: boolean;
      statusCode?: number;
      requestId?: string;
      details?: Record<string, any>;
      cause?: Error;
    }
  ) {
    super(message);
    this.name = "ScrawnError";
    this.code = options.code;
    this.retryable = options.retryable ?? false;
    this.statusCode = options.statusCode;
    this.requestId = options.requestId;
    this.details = options.details;
    this.cause = options.cause;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to a plain object for logging/serialization.
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      retryable: this.retryable,
      statusCode: this.statusCode,
      requestId: this.requestId,
      details: this.details,
      stack: this.stack,
    };
  }
}

/**
 * Authentication or authorization error (401, 403).
 * Thrown when API key is invalid, expired, or lacks permissions.
 *
 * @example
 * ```typescript
 * throw new ScrawnAuthenticationError('Invalid API key', {
 *   statusCode: 401,
 *   requestId: 'req_123'
 * });
 * ```
 */
export class ScrawnAuthenticationError extends ScrawnError {
  constructor(
    message: string,
    options?: {
      statusCode?: number;
      requestId?: string;
      details?: Record<string, any>;
      cause?: Error;
    }
  ) {
    super(message, {
      code: "AUTHENTICATION_ERROR",
      retryable: false,
      statusCode: options?.statusCode ?? 401,
      requestId: options?.requestId,
      details: options?.details,
      cause: options?.cause,
    });
    this.name = "ScrawnAuthenticationError";
  }
}

/**
 * Validation error (400).
 * Thrown when request payload fails validation.
 *
 * @example
 * ```typescript
 * throw new ScrawnValidationError('Invalid userId', {
 *   details: { field: 'userId', constraint: 'non-empty' }
 * });
 * ```
 */
export class ScrawnValidationError extends ScrawnError {
  constructor(
    message: string,
    options?: {
      requestId?: string;
      details?: Record<string, any>;
      cause?: Error;
    }
  ) {
    super(message, {
      code: "VALIDATION_ERROR",
      retryable: false,
      statusCode: 400,
      requestId: options?.requestId,
      details: options?.details,
      cause: options?.cause,
    });
    this.name = "ScrawnValidationError";
  }
}

/**
 * Rate limit error (429).
 * Thrown when API rate limits are exceeded.
 *
 * @example
 * ```typescript
 * throw new ScrawnRateLimitError('Rate limit exceeded', {
 *   details: { retryAfter: 60 }
 * });
 * ```
 */
export class ScrawnRateLimitError extends ScrawnError {
  /** Seconds to wait before retrying (if provided by API) */
  public readonly retryAfter?: number;

  constructor(
    message: string,
    options?: {
      requestId?: string;
      retryAfter?: number;
      details?: Record<string, any>;
      cause?: Error;
    }
  ) {
    super(message, {
      code: "RATE_LIMIT_ERROR",
      retryable: true,
      statusCode: 429,
      requestId: options?.requestId,
      details: options?.details,
      cause: options?.cause,
    });
    this.name = "ScrawnRateLimitError";
    this.retryAfter = options?.retryAfter;
  }
}

/**
 * Network-related error (timeout, connection failure, DNS issues).
 * These are typically retryable.
 *
 * @example
 * ```typescript
 * throw new ScrawnNetworkError('Connection timeout', {
 *   cause: originalError,
 *   details: { timeout: 30000 }
 * });
 * ```
 */
export class ScrawnNetworkError extends ScrawnError {
  constructor(
    message: string,
    options?: {
      requestId?: string;
      details?: Record<string, any>;
      cause?: Error;
    }
  ) {
    super(message, {
      code: "NETWORK_ERROR",
      retryable: true,
      requestId: options?.requestId,
      details: options?.details,
      cause: options?.cause,
    });
    this.name = "ScrawnNetworkError";
  }
}

/**
 * API error from the Scrawn backend (5xx or other server errors).
 * May be retryable depending on status code.
 *
 * @example
 * ```typescript
 * throw new ScrawnAPIError('Internal server error', {
 *   statusCode: 500,
 *   retryable: true,
 *   requestId: 'req_123'
 * });
 * ```
 */
export class ScrawnAPIError extends ScrawnError {
  constructor(
    message: string,
    options: {
      statusCode: number;
      requestId?: string;
      retryable?: boolean;
      details?: Record<string, any>;
      cause?: Error;
    }
  ) {
    super(message, {
      code: "API_ERROR",
      retryable: options.retryable ?? options.statusCode >= 500,
      statusCode: options.statusCode,
      requestId: options.requestId,
      details: options.details,
      cause: options.cause,
    });
    this.name = "ScrawnAPIError";
  }
}

/**
 * Configuration error (invalid SDK initialization or settings).
 * Not retryable - requires code changes.
 *
 * @example
 * ```typescript
 * throw new ScrawnConfigError('Invalid baseURL format', {
 *   details: { baseURL: 'invalid-url' }
 * });
 * ```
 */
export class ScrawnConfigError extends ScrawnError {
  constructor(
    message: string,
    options?: {
      details?: Record<string, any>;
      cause?: Error;
    }
  ) {
    super(message, {
      code: "CONFIG_ERROR",
      retryable: false,
      details: options?.details,
      cause: options?.cause,
    });
    this.name = "ScrawnConfigError";
  }
}

/**
 * Helper function to convert gRPC/ConnectRPC errors to Scrawn errors.
 * Maps gRPC status codes to appropriate Scrawn error types.
 *
 * @internal
 */
export function convertGrpcError(error: any, requestId?: string): ScrawnError {
  const message = error.message || "Unknown error occurred";
  const code = error.code;

  // Extract gRPC status code
  // ConnectRPC uses Code enum: https://connectrpc.com/docs/web/errors
  switch (code) {
    case 16: // UNAUTHENTICATED
    case 7: // PERMISSION_DENIED
      return new ScrawnAuthenticationError(message, {
        statusCode: code === 16 ? 401 : 403,
        requestId,
        cause: error,
      });

    case 3: // INVALID_ARGUMENT
      return new ScrawnValidationError(message, {
        requestId,
        cause: error,
      });

    case 8: // RESOURCE_EXHAUSTED (rate limit)
      return new ScrawnRateLimitError(message, {
        requestId,
        cause: error,
      });

    case 14: // UNAVAILABLE
    case 4: // DEADLINE_EXCEEDED
      return new ScrawnNetworkError(message, {
        requestId,
        details: { grpcCode: code },
        cause: error,
      });

    case 13: // INTERNAL
    case 2: // UNKNOWN
    case 12: // UNIMPLEMENTED
      return new ScrawnAPIError(message, {
        statusCode: 500,
        retryable: code !== 12, // UNIMPLEMENTED is not retryable
        requestId,
        details: { grpcCode: code },
        cause: error,
      });

    default:
      // Generic API error for unknown codes
      return new ScrawnAPIError(message, {
        statusCode: 500,
        retryable: false,
        requestId,
        details: { grpcCode: code },
        cause: error,
      });
  }
}

/**
 * Helper to check if an error is a Scrawn error.
 */
export function isScrawnError(error: unknown): error is ScrawnError {
  return error instanceof ScrawnError;
}

/**
 * Helper to check if an error is retryable.
 */
export function isRetryableError(error: unknown): boolean {
  return isScrawnError(error) && error.retryable;
}
