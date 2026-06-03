import type { AuthBase } from "./auth/baseAuth.js";
import type {
  EventPayload,
  MiddlewareRequest,
  MiddlewareResponse,
  MiddlewareNext,
  MiddlewareEventConfig,
  AITokenUsagePayload,
  EventConsumerErrorCallback,
  RetryContext,
  Debit,
} from "./types/event.js";
import type {
  AuthRegistry,
  AuthMethodName,
  AllCredentials,
} from "./types/auth.js";
import type {
  TagExpr,
  PriceExpr,
  ExprRef,
  ExprValue,
} from "./pricing/types.js";
import { toExprValue } from "./pricing/types.js";
import { ApiKeyAuth } from "./auth/apiKeyAuth.js";
import { ScrawnLogger } from "../utils/logger.js";
import { matchPath } from "../utils/pathMatcher.js";
import { forkAsyncIterable } from "../utils/forkAsyncIterable.js";
import {
  EventPayloadSchema,
  AITokenUsagePayloadSchema,
} from "./types/event.js";
import { GrpcClient } from "./grpc/index.js";
import {
  EventServiceClient,
  EventType,
  BasicUsageType,
} from "../gen/event/v1/event.js";
import type {
  RegisterEventRequest as RegisterEventRequestType,
  StreamEventRequest as StreamEventRequestType,
  StreamEventResponse,
  BasicUsage,
  AITokenUsage,
} from "../gen/event/v1/event.js";
import {
  PaymentServiceClient,
  CreateCheckoutLinkRequest,
  type CreateCheckoutLinkResponse,
} from "../gen/payment/v1/payment.js";
import {
  ScrawnError,
  ScrawnConfigError,
  ScrawnValidationError,
  convertGrpcError,
  isScrawnError,
  isRetryableError,
} from "./errors/index.js";
import {
  serializeExpr,
  resolveTokens,
  prettyPrintExpr,
  tag as _tag,
} from "./pricing/index.js";
import { createBillableAI } from "./ai/wrap.js";
import type { BillableAIOptions } from "./ai/types.js";
import type { WithUserId } from "./ai/types.js";
import { buildAIPayload } from "./ai/track.js";
import type {
  LanguageModelUsage,
  ModelInfo,
  BillableCallParams,
} from "./ai/types.js";
import { ScrawnConfig } from "../config.js";
import { randomUUID } from "node:crypto";
import type { TokenContext } from "./pricing/index.js";

export type NormalizedDebit =
  | { case: "amount"; value: number }
  | { case: "expr"; value: string };

function normalizeDebit(debit: number | PriceExpr<string>): NormalizedDebit {
  if (typeof debit === "number") {
    return { case: "amount", value: debit };
  }
  return { case: "expr", value: serializeExpr(debit) };
}

function normalizeAIDebit(
  debit: number | PriceExpr<string>,
  tokenContext: TokenContext
): NormalizedDebit {
  if (typeof debit === "number") {
    return { case: "amount", value: debit };
  }
  const resolved = resolveTokens(debit, tokenContext);
  return { case: "expr", value: serializeExpr(resolved) };
}
import {
  verifyWebhook,
  WebhookVerificationError,
  toWebRequest,
} from "./webhook/index.js";
import type { WebhookEvent } from "./webhook/types.js";

const log = new ScrawnLogger("Scrawn");

/**
 * Main SDK class for Scrawn billing infrastructure.
 *
 * Manages authentication, event tracking, and credential caching.
 * All event consumption methods are available directly on the SDK instance.
 *
 * @typeParam TTags - Union of valid tag names for compile-time type checking
 *
 * @example
 * ```typescript
 * import { scrawn } from '@scrawn/core';
 *
 * const biller = scrawn({
 *   apiKey: process.env.SCRAWN_KEY,
 *   baseURL: 'http://localhost:8069',
 *   httpUrl: 'http://localhost:8070',
 *   tags: ["PREMIUM_CALL", "EXTRA_FEE"] as const,
 * });
 *
 * // Tags are compile-time checked
 * biller.basicUsageEventConsumer({ userId: 'u123', debitTag: 'PREMIUM_FEATURE' });
 * // biller.basicUsageEventConsumer({ userId: 'u123', debitTag: 'UNKNOWN' }); // Type error!
 * ```
 */
export class Scrawn<
  TTags extends string = string,
  TExprs extends string = string
> {
  /** Map of authentication method names to their implementations */
  private authMethods = new Map<AuthMethodName, AuthBase<AllCredentials>>();

  /**
   * Cache of credentials keyed by auth method name for performance.
   * Keys are restricted to registered auth method names only.
   */
  private credCache = new Map<AuthMethodName, AllCredentials>();

  /** API key used for default authentication */
  private apiKey: AllCredentials["apiKey"];

  /** gRPC client for making type-safe API calls */
  private grpcClient: GrpcClient;

  /** Number of auto-retry attempts on retryable errors before falling back to onError */
  private retryCount: number;

  /** Public access to the gRPC client for use by other packages (e.g. @scrawn/analytics) */
  public get grpc(): GrpcClient {
    return this.grpcClient;
  }

  /** API key used for authorizing gRPC calls */
  public get apikey(): string {
    return this.apiKey;
  }

  /** Base URL for the HTTP API (derived from baseURL config) */
  private httpUrl: string;

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private backoffMs(attempt: number): number {
    return Math.min(1000 * Math.pow(2, attempt), 8000);
  }

  private notifyEventConsumerError(
    error: unknown,
    onError?: EventConsumerErrorCallback
  ) {
    const converted = isScrawnError(error) ? error : convertGrpcError(error);
    onError?.(converted);
    return converted;
  }

  private notifyValidationError(
    error: ScrawnValidationError,
    onError?: EventConsumerErrorCallback
  ) {
    onError?.(error);
    return error;
  }

  /** Shared: formats Zod issues into a ScrawnValidationError and notifies the callback. */
  private formatValidationError(
    message: string,
    issues: import("zod").ZodIssue[],
    onError?: EventConsumerErrorCallback
  ): ScrawnValidationError {
    const error = new ScrawnValidationError(message, {
      details: {
        errors: issues.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      },
    });
    this.notifyValidationError(error, onError);
    return error;
  }

  /**
   * Creates a new Scrawn SDK instance.
   *
   * @param config - Configuration object
   * @param config.apiKey - Your Scrawn API key for authentication
   * @param config.baseURL - Base URL for the Scrawn gRPC API (e.g., 'http://localhost:8069')
   * @param config.httpUrl - HTTP URL for the Scrawn HTTP API (e.g., 'http://localhost:8070')
   *
   * @example
   * ```typescript
   * const scrawn = new Scrawn({
   *   apiKey: 'sk_test_...',
   *   baseURL: 'http://localhost:8069',
   *   httpUrl: 'http://localhost:8070',
   * });
   * await scrawn.init();
   * ```
   */
  constructor(config: {
    apiKey: AllCredentials["apiKey"];
    baseURL: string;
    httpUrl: string;
    secure?: boolean;
    credentials?: import("@grpc/grpc-js").ChannelCredentials;
    retryCount?: number;
    webhookPublicKey?: string;
  }) {
    try {
      // Validate configuration
      if (!config.apiKey || typeof config.apiKey !== "string") {
        throw new ScrawnConfigError(
          "API key is required and must be a string",
          {
            details: { provided: typeof config.apiKey },
          }
        );
      }

      if (!config.baseURL || typeof config.baseURL !== "string") {
        throw new ScrawnConfigError(
          "baseURL is required and must be a string",
          {
            details: { provided: typeof config.baseURL },
          }
        );
      }

      if (!config.httpUrl || typeof config.httpUrl !== "string") {
        throw new ScrawnConfigError(
          "httpUrl is required and must be a string",
          {
            details: { provided: typeof config.httpUrl },
          }
        );
      }

      this.apiKey = config.apiKey;
      this.retryCount = config.retryCount ?? 2;
      this.httpUrl = config.httpUrl;
      if (config.webhookPublicKey) {
        this.cachedPublicKey = config.webhookPublicKey;
      }
      this.grpcClient = new GrpcClient(this.parseURLToTarget(config.baseURL), {
        secure: config.secure ?? true,
        credentials: config.credentials,
      });
      this.registerAuthMethod("api", new ApiKeyAuth(this.apiKey));
    } catch (error) {
      log.error("Failed to initialize Scrawn SDK");
      throw error;
    }
  }

  private parseURLToTarget(baseURL: string): string {
    if (baseURL.includes("://")) {
      const url = new URL(baseURL);
      return `${url.hostname}:${url.port || ScrawnConfig.grpc.defaultPort}`;
    }

    return baseURL.includes(":")
      ? baseURL
      : `${baseURL}:${ScrawnConfig.grpc.defaultPort}`;
  }

  /**
   * Create a type-safe tag reference.
   *
   * Only tag names known to this biller instance are accepted at compile time.
   * Tag values are resolved to cent amounts by the backend at runtime.
   *
   * @param name - The tag name (must be one of the known tags for this instance)
   * @returns A TagExpr referencing the named tag
   * @throws PricingExpressionError at runtime if name format is invalid
   *
   * @example
   * ```typescript
   * const expr = mul(biller.tag("PREMIUM_CALL"), 3);
   * ```
   */
  tag<T extends TTags>(name: T): TagExpr<T> {
    return _tag(name);
  }

  /**
   * Create a type-safe reference to a persisted expression, inline expression,
   * tag, or raw amount. All expressions should go through `biller.expr()`.
   *
   * Expression names are compile-time checked against known expressions
   * synced from the Scrawn server. The backend resolves the stored
   * expression string and evaluates it at runtime.
   *
   * Also accepts inline PriceExpr, TagExpr, and raw numbers as a unified
   * `biller.expr()` entry point.
   *
   * @param value - A persisted expression name, inline PriceExpr, TagExpr, or raw number
   * @returns A PriceExpr representing the expression
   *
   * @example
   * ```typescript
   * // Reference a persisted expression
   * biller.expr("MY_EXPR")
   *
   * // Inline expression
   * biller.expr(mul(biller.tag("PREMIUM_CALL"), 3))
   *
   * // Wrap a tag
   * biller.expr(biller.tag("EXTRA_FEE"))
   *
   * // Wrap a raw amount
   * biller.expr(250)
   * ```
   */
  expr(amount: number): ExprValue<TTags>;
  expr<T extends TExprs>(name: T): ExprValue<TTags>;
  expr(expr: PriceExpr<TTags>): ExprValue<TTags>;
  expr(value: string | number | PriceExpr<TTags>): ExprValue<TTags> {
    if (typeof value === "string") {
      return toExprValue({ kind: "exprRef", name: value } as PriceExpr<TTags>);
    }
    if (typeof value === "number") {
      return toExprValue({ kind: "amount", value } as PriceExpr<TTags>);
    }
    return toExprValue(value);
  }

  /**
   * Register an authentication method with the SDK.
   *
   * Auth methods handle credential management and can be shared across multiple event types.
   * Only auth method names defined in AuthRegistry are allowed.
   *
   * @param name - Unique identifier for this auth method (must be in AuthRegistry)
   * @param auth - Instance of an AuthBase implementation
   *
   * @example
   * ```typescript
   * scrawn.registerAuthMethod('api', new ApiKeyAuth('sk_test_...'));
   * ```
   */
  private registerAuthMethod<K extends AuthMethodName>(
    name: K,
    auth: AuthBase<AuthRegistry[K]>
  ) {
    this.authMethods.set(name, auth as AuthBase<AllCredentials>);
  }

  /**
   * Get credentials for a specific authentication method.
   *
   * Credentials are cached after the first fetch for performance.
   * Subsequent calls return the cached value without re-fetching.
   * Only auth method names defined in AuthRegistry are allowed.
   *
   * @param authMethodName - Name of the auth method to get credentials for (must be in AuthRegistry)
   * @returns A promise that resolves to the credentials object
   * @throws Error if the auth method is not registered
   *
   * @example
   * ```typescript
   * const creds = await scrawn.getCredsFor('api');
   * // { apiKey: 'sk_test_...' }
   * ```
   */
  private async getCredsFor<K extends AuthMethodName>(
    authMethodName: K
  ): Promise<AuthRegistry[K]> {
    // Check cache first
    if (this.credCache.has(authMethodName)) {
      return this.credCache.get(authMethodName)! as AuthRegistry[K];
    }

    // Get fresh creds from auth method
    const auth = this.authMethods.get(authMethodName);
    if (!auth) {
      throw new ScrawnConfigError(
        `No auth method registered: ${authMethodName}`,
        {
          details: { requestedMethod: authMethodName },
        }
      );
    }

    const creds = await auth.getCreds();
    this.credCache.set(authMethodName, creds);
    return creds as AuthRegistry[K];
  }

  /**
   * Track a basic usage event.
   *
   * Records basic usage to the Scrawn backend for billing tracking.
   * The event is authenticated using the API key provided during SDK initialization.
   *
   * @param payload - The usage data to track
   * @param payload.userId - Unique identifier of the user making the call
   * @param payload.debitAmount - (Optional) Direct amount in cents to debit from the user's account
   * @param payload.debitTag - (Optional) Named price tag for backend-managed pricing
   * @param payload.debitExpr - (Optional) Pricing expression for complex calculations
   * @param payload.metadata - (Optional) Arbitrary metadata to associate with the event
   * @param options - Optional configuration
   * @param options.eventId - (Optional) Override the auto-generated event ID
   * @param options.onError - Optional callback for handling validation or gRPC errors
   * @returns A promise that resolves when the event is tracked or returns early on error
   *
   * @example
   * ```typescript
   * import { add, mul, tag } from '@scrawn/core';
   *
   * // Using direct amount (500 cents = $5.00)
   * await scrawn.basicUsageEventConsumer({
   *   userId: 'user_abc123',
   *   debitAmount: 500
   * });
   *
   * // Using price tag
   * await scrawn.basicUsageEventConsumer({
   *   userId: 'user_abc123',
   *   debitTag: 'PREMIUM_FEATURE'
   * });
   *
   * // Using pricing expression: (PREMIUM_CALL * 3) + EXTRA_FEE + 250 cents
   * await scrawn.basicUsageEventConsumer({
   *   userId: 'user_abc123',
   *   debitExpr: add(mul(tag('PREMIUM_CALL'), 3), tag('EXTRA_FEE'), 250)
   * });
   * ```
   */
  async basicUsageEventConsumer(
    payload: EventPayload<TTags>,
    options?: { eventId?: string; onError?: EventConsumerErrorCallback }
  ): Promise<void> {
    const rawPayload = {
      userId: payload.userId,
      debit: payload.debit,
      metadata: payload.metadata,
    };
    const validationResult = EventPayloadSchema.safeParse(rawPayload);
    if (!validationResult.success) {
      const errors = validationResult.error.issues
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      log.error(`Invalid payload for basicUsageEventConsumer: ${errors}`);
      this.formatValidationError(
        "Payload validation failed",
        validationResult.error.issues,
        options?.onError
      );
      return;
    }

    // Fixed identity for this event — survives retries
    const eventId = options?.eventId ?? randomUUID();
    const idempotencyKey = randomUUID();

    const debit = normalizeDebit(validationResult.data.debit);
    const normalizedPayload = {
      userId: validationResult.data.userId,
      debit,
      metadata: validationResult.data.metadata,
      reportedTimestamp: validationResult.data.reportedTimestamp,
    };

    const attempt = () =>
      this.consumeEvent(
        normalizedPayload,
        "api",
        "RAW",
        eventId,
        idempotencyKey
      );

    try {
      await attempt();
    } catch (error) {
      log.error(
        `Failed to track basicUsageEventConsumer event: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );

      if (options?.onError) {
        const converted = isScrawnError(error)
          ? (error as import("./errors/index.js").ScrawnError)
          : convertGrpcError(error);

        let manualRetryCount = 0;
        const maxManualRetries = this.retryCount;

        const retryContext: RetryContext = {
          get retryCount() {
            return manualRetryCount;
          },
          retry: async () => {
            if (manualRetryCount >= maxManualRetries) {
              const exceededError = new ScrawnError(
                "Manual retry limit exceeded",
                {
                  code: "RETRY_LIMIT_EXCEEDED",
                  retryable: false,
                  details: { retriesAttempted: manualRetryCount },
                }
              );
              options.onError!(exceededError);
              return;
            }
            manualRetryCount++;
            try {
              await attempt();
            } catch (retryError) {
              const convertedRetry = isScrawnError(retryError)
                ? (retryError as import("./errors/index.js").ScrawnError)
                : convertGrpcError(retryError);
              options.onError!(convertedRetry, retryContext);
            }
          },
        };

        options.onError(converted, retryContext);
      }
      return;
    }
  }

  /**
   * Create an Express-compatible middleware for tracking API endpoint usage.
   *
   * This middleware automatically tracks requests to your API endpoints for billing purposes.
   * You provide an extractor function that determines the userId and debit info (amount or tag) from each request.
   * Optionally, you can provide a whitelist array to only track specific endpoints,
   * or a blacklist array to exclude specific endpoints from tracking.
   *
   * The middleware is framework-agnostic and works with Express, Fastify, and similar frameworks.
   *
   * @param config - Configuration object for the middleware
   * @param config.extractor - Function that extracts userId and debitAmount from the request. Return null to skip tracking.
   * @param config.whitelist - Optional array of endpoint patterns to track. Supports wildcards:
   *                            - Exact match: /api/users
   *                            - Single segment (*): /api/* matches /api/users but not /api/users/123
   *                            - Multi-segment (**): /api/** matches any path starting with /api/
   *                            - Mixed: /api/star/profile, **.php
   *                            Takes precedence over blacklist. If omitted, all requests will be tracked.
   * @param config.blacklist - Optional array of endpoint patterns to exclude. Same wildcard support as whitelist.
   *                            Only applies to endpoints not in the whitelist.
   * @param config.onError - Optional callback for handling validation or gRPC errors
   *
   * @returns Express-compatible middleware function
   *
   * @example
   * ```typescript
   * // Track all endpoints
   * app.use(scrawn.middlewareEventConsumer({
   *   extractor: (req) => ({
   *     userId: req.user.id,
   *     debitAmount: 1
   *   })
   * }));
   *
   * // Track only specific endpoints with wildcards
   * app.use(scrawn.middlewareEventConsumer({
   *   extractor: (req) => ({
   *     userId: req.headers['x-user-id'] as string,
   *     debitAmount: req.body.tokens || 1
   *   }),
   *   whitelist: ['/api/generate', '/api/analyze', '/api/v1/*']
   * }));
   *
   * // Exclude specific endpoints from tracking
   * app.use(scrawn.middlewareEventConsumer({
   *   extractor: (req) => ({
   *     userId: req.user.id,
   *     debitAmount: 1
   *   }),
   *   blacklist: ['/health', '/api/collect-payment', '/internal/**', '**.tmp']
   * }));
   * ```
   */
  middlewareEventConsumer(config: MiddlewareEventConfig<TTags>) {
    return async (
      req: MiddlewareRequest,
      res: MiddlewareResponse,
      next: MiddlewareNext
    ) => {
      try {
        const requestPath = req.path || req.url || "";

        // Check whitelist first (takes precedence)
        if (config.whitelist && config.whitelist.length > 0) {
          const isWhitelisted = config.whitelist.some((pattern) =>
            matchPath(requestPath, pattern)
          );

          if (!isWhitelisted) {
            return next();
          }
        }

        // Then check blacklist
        if (config.blacklist && config.blacklist.length > 0) {
          const isBlacklisted = config.blacklist.some((pattern) =>
            matchPath(requestPath, pattern)
          );

          if (isBlacklisted) {
            return next();
          }
        }

        const extractedPayload = await config.extractor(req);

        // If extractor returns null, skip tracking
        if (extractedPayload === null) {
          log.warn(
            `Extractor returned null for path: ${requestPath}. Skipping event tracking.`
          );
          return next();
        }

        const rawPayload = {
          userId: extractedPayload.userId,
          debit: extractedPayload.debit,
          metadata: extractedPayload.metadata,
          reportedTimestamp: extractedPayload.reportedTimestamp,
        };
        const validationResult = EventPayloadSchema.safeParse(rawPayload);
        if (!validationResult.success) {
          const errors = validationResult.error.issues
            .map((e) => `${e.path.join(".")}: ${e.message}`)
            .join(", ");
          log.error(
            `Invalid payload extracted in middlewareEventConsumer: ${errors}`
          );
          this.formatValidationError(
            "Payload validation failed",
            validationResult.error.issues,
            config.onError
          );
          return next();
        }

        const eventId = randomUUID();
        const idempotencyKey = randomUUID();

        const debit = normalizeDebit(validationResult.data.debit);
        const normalizedPayload = {
          userId: validationResult.data.userId,
          debit,
          metadata: validationResult.data.metadata,
          reportedTimestamp: validationResult.data.reportedTimestamp,
        };

        this.consumeEvent(
          normalizedPayload,
          "api",
          "MIDDLEWARE_CALL",
          eventId,
          idempotencyKey
        ).catch((error) => {
          log.error(`Failed to track middleware event: ${error.message}`);
          this.notifyEventConsumerError(error, config.onError);
        });

        next();
      } catch (error) {
        log.error(
          `Error in middlewareEventConsumer: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        this.notifyEventConsumerError(error, config.onError);
        next();
      }
    };
  }

  /**
   * Collect payment by creating a checkout link for a user.
   *
   * Generates a payment checkout link for the specified user via the Scrawn payment service.
   * The checkout link can be used to direct users to complete their payment.
   *
   * @param userId - Unique identifier of the user to collect payment from
   * @returns A promise that resolves to the checkout link URL
   * @throws Error if the gRPC call fails or if authentication is invalid
   *
   * @example
   * ```typescript
   * const checkoutLink = await scrawn.collectPayment('user_abc123');
   * // Returns: 'https://checkout.scrawn.dev/...'
   * // Redirect user to this URL to complete payment
   * ```
   */
  async collectPayment(userId: string): Promise<string> {
    // Validate input
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      log.error("Invalid userId provided to collectPayment");
      throw new ScrawnValidationError("userId must be a non-empty string", {
        details: { provided: typeof userId },
      });
    }

    // Get credentials for authentication
    const creds = await this.getCredsFor("api");

    try {
      log.info(`Creating checkout link for user: ${userId}`);

      const request = { userId } as CreateCheckoutLinkRequest;

      const response = await this.grpcClient
        .newCall(PaymentServiceClient, "createCheckoutLink")
        .addMetadata("authorization", `Bearer ${creds.apiKey}`)
        .addPayload(request)
        .request<CreateCheckoutLinkResponse>();

      log.info(`Checkout link created successfully: ${response.checkoutLink}`);
      return response.checkoutLink;
    } catch (error) {
      log.error(
        `Failed to create checkout link: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw convertGrpcError(error);
    }
  }

  /**
   * Internal method to consume and process an event.
   *
   * This method:
   * 1. Validates authentication
   * 2. Fetches/caches credentials
   * 3. Executes any pre-run hooks
   * 4. Processes the event via gRPC call to RegisterEvent
   *
   * @param payload - Event payload data
   * @param authMethodName - Name of the auth method to use (must be in AuthRegistry)
   * @param eventType - Type of event for categorization (RAW or MIDDLEWARE_CALL)
   * @param eventId - Stable event ID (generated by caller, reused across retries)
   * @param idempotencyKey - Stable idempotency key (generated by caller, reused across retries)
   * @returns A promise that resolves when the event is processed
   * @throws Error if auth method is not registered or gRPC call fails
   *
   * @internal
   */
  private async consumeEvent<K extends AuthMethodName>(
    payload: {
      userId: string;
      debit: NormalizedDebit;
      metadata?: Record<string, unknown>;
      reportedTimestamp?: number;
    },
    authMethodName: K,
    eventType: "RAW" | "MIDDLEWARE_CALL",
    eventId: string,
    idempotencyKey: string
  ): Promise<void> {
    const auth = this.authMethods.get(authMethodName);
    if (!auth) {
      throw new ScrawnConfigError(
        `No auth registered for type ${authMethodName}`,
        {
          details: { requestedAuth: authMethodName },
        }
      );
    }

    // Run pre-hook if exists
    if (auth.preRun) await auth.preRun();

    // Get creds (from cache or fresh)
    const creds = await this.getCredsFor(authMethodName);

    // Map event type to BasicUsageType
    const basicUsageType =
      eventType === "RAW" ? BasicUsageType.RAW : BasicUsageType.MIDDLEWARE_CALL;

    // Build debit field — already normalized by caller
    const debitField = payload.debit;

    // Resolve timestamp once — stable across retries
    const resolvedTimestamp =
      payload.reportedTimestamp ?? Math.floor(Date.now() / 1000);

    // Retry loop for retryable failures
    for (let attempt = 0; ; attempt++) {
      try {
        log.info(
          `Ingesting event (type: ${eventType}) — attempt ${attempt + 1}`
        );

        const basicUsage = {
          basicUsageType,
          amount: debitField.case === "amount" ? debitField.value : undefined,
          expr: debitField.case === "expr" ? debitField.value : undefined,
          metadata: payload.metadata
            ? JSON.stringify(payload.metadata)
            : undefined,
        } as BasicUsage;

        const request = {
          type: EventType.BASIC_USAGE,
          userId: payload.userId,
          reportedTimestamp: resolvedTimestamp,
          eventId,
          idempotencyKey,
          basicUsage,
        } as RegisterEventRequestType;

        const response = await this.grpcClient
          .newCall(EventServiceClient, "registerEvent")
          .addMetadata("authorization", `Bearer ${creds.apiKey}`)
          .addPayload(request)
          .request();

        log.info(`Event registered successfully: ${JSON.stringify(response)}`);
        break;
      } catch (error) {
        const converted = convertGrpcError(error);
        if (attempt < this.retryCount && isRetryableError(converted)) {
          const delay = this.backoffMs(attempt);
          log.warn(
            `Retryable error on attempt ${
              attempt + 1
            }, retrying in ${delay}ms: ${converted.message}`
          );
          await this.sleep(delay);
          continue;
        }
        log.error(`Failed to register event: ${converted.message}`);
        throw converted;
      }
    }

    if (auth.postRun) await auth.postRun();
  }

  /**
   * Configuration options for aiTokenStreamConsumer.
   */
  // Overload signatures for aiTokenStreamConsumer

  /**
   * Stream AI token usage events to the Scrawn backend (fire-and-forget mode).
   *
   * Consumes an async iterable of AI token usage payloads and streams them
   * to the backend for billing tracking. This is designed for real-time
   * AI token tracking where usage is reported as tokens are consumed.
   *
   * @param stream - An async iterable of AI token usage payloads
   * @returns A promise that resolves to the stream response or undefined on error
   */
  // fallow-ignore-next-line unused-class-member
  async aiTokenStreamConsumer(
    stream: AsyncIterable<AITokenUsagePayload<TTags>>
  ): Promise<StreamEventResponse | undefined>;

  /**
   * Stream AI token usage events to the Scrawn backend (fire-and-forget mode).
   *
   * @param stream - An async iterable of AI token usage payloads
   * @param config - Configuration with return: false (or omitted)
   * @returns A promise that resolves to the stream response or undefined on error
   */
  // fallow-ignore-next-line unused-class-member
  async aiTokenStreamConsumer(
    stream: AsyncIterable<AITokenUsagePayload<TTags>>,
    config: { return?: false; onError?: EventConsumerErrorCallback }
  ): Promise<StreamEventResponse | undefined>;

  /**
   * Stream AI token usage events to the Scrawn backend while returning a forked stream.
   *
   * When `return: true`, the input stream is forked: one fork is sent to the billing
   * backend (non-blocking), and the other fork is returned to the caller for streaming
   * to the user. This enables simultaneous billing and user-facing token streaming.
   *
   * @param stream - An async iterable of AI token usage payloads
   * @param config - Configuration with return: true
   * @returns Object containing the response promise (or undefined on error) and a forked stream for user consumption
   *
   * @example
   * ```typescript
   * const { response, stream: userStream } = await scrawn.aiTokenStreamConsumer(
   *   tokenGenerator(),
   *   { return: true }
   * );
   *
   * // Stream tokens to user while billing happens in background
   * for await (const token of userStream) {
   *   process.stdout.write(token.outputTokens.toString());
   * }
   *
   * // Billing completes after stream is consumed
   * const result = await response;
   * if (result) {
   *   console.log(`Billed ${result.eventsProcessed} events`);
   * }
   * ```
   */
  // fallow-ignore-next-line unused-class-member
  async aiTokenStreamConsumer(
    stream: AsyncIterable<AITokenUsagePayload<TTags>>,
    config: { return: true; onError?: EventConsumerErrorCallback }
  ): Promise<{
    response: Promise<StreamEventResponse | undefined>;
    stream: AsyncIterable<AITokenUsagePayload<TTags>>;
  }>;

  /**
   * Stream AI token usage events to the Scrawn backend.
   *
   * Consumes an async iterable of AI token usage payloads and streams them
   * to the backend for billing tracking. This is designed for real-time
   * AI token tracking where usage is reported as tokens are consumed.
   *
   * The streaming is non-blocking: the iterable is consumed in the background
   * and streamed to the server without blocking the caller's code path.
   *
   * When `return: true`, the stream is forked internally - one fork goes to
   * billing (non-blocking), and another is returned to the caller for streaming
   * to the user.
   *
   * @param stream - An async iterable of AI token usage payloads
   * @param config - Optional configuration object
   * @param config.return - If true, returns a forked stream alongside the response promise
   * @param config.onError - Optional callback for handling validation or gRPC errors
   * @returns Depends on config.return:
   *   - false/undefined: Promise<StreamEventResponse | undefined>
   *   - true: { response: Promise<StreamEventResponse | undefined>, stream: AsyncIterable<AITokenUsagePayload> }
   *
   * @example
   * ```typescript
   * // Fire-and-forget mode (default)
   * async function* tokenUsageStream() {
   *   yield {
   *     userId: 'user_abc123',
   *     model: 'gpt-4',
   *     inputTokens: 100,
   *     outputTokens: 50,
   *     inputDebit: { amount: 1 },
   *     outputDebit: { amount: 1 }
   *   };
   * }
   *
   * const response = await scrawn.aiTokenStreamConsumer(tokenUsageStream());
   * if (response) {
   *   console.log(`Processed ${response.eventsProcessed} events`);
   * }
   *
   * // Return mode - stream to user while billing
   * const { response, stream } = await scrawn.aiTokenStreamConsumer(
   *   tokenUsageStream(),
   *   { return: true }
   * );
   *
   * for await (const token of stream) {
   *   // Stream to user
   * }
   *
   * const result = await response;
   * if (!result) return;
   * ```
   */
  // fallow-ignore-next-line unused-class-member
  async aiTokenStreamConsumer(
    stream: AsyncIterable<AITokenUsagePayload<TTags>>,
    config?: { return?: boolean; onError?: EventConsumerErrorCallback }
  ): Promise<
    | StreamEventResponse
    | undefined
    | {
        response: Promise<StreamEventResponse | undefined>;
        stream: AsyncIterable<AITokenUsagePayload<TTags>>;
      }
  > {
    const onError = config?.onError;
    // Get credentials for authentication
    const creds = await this.getCredsFor("api");

    // If return mode, fork the stream
    if (config?.return === true) {
      const [billingStream, userStream] = forkAsyncIterable(stream);

      // Transform billing stream and send to backend (non-blocking)
      const transformedStream = this.transformAITokenStream(
        billingStream,
        onError
      );

      const responsePromise = (async (): Promise<
        StreamEventResponse | undefined
      > => {
        const result = await this.performAIStreamCall(
          creds.apiKey,
          transformedStream,
          onError
        );
        return result;
      })();

      return { response: responsePromise, stream: userStream };
    }

    // Default: fire-and-forget mode
    const transformedStream = this.transformAITokenStream(stream, onError);

    return this.performAIStreamCall(creds.apiKey, transformedStream, onError);
  }

  /**
   * Shared: performs a gRPC streaming call for AI token events.
   * Used by both return-mode and fire-and-forget branches of aiTokenStreamConsumer.
   */
  private async performAIStreamCall(
    apiKey: string,
    transformedStream: AsyncIterable<unknown>,
    onError?: EventConsumerErrorCallback
  ): Promise<StreamEventResponse | undefined> {
    try {
      log.info("Starting AI token usage stream");

      const response = await this.grpcClient
        .newStreamCall(EventServiceClient, "streamEvents")
        .addMetadata("authorization", `Bearer ${apiKey}`)
        .stream<StreamEventResponse>(transformedStream);

      log.info(
        `AI token stream completed: ${response.eventsProcessed} events processed`
      );
      return response;
    } catch (error) {
      log.error(
        `Failed to stream AI token usage: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      this.notifyEventConsumerError(error, onError);
      return undefined;
    }
  }

  /**
   * Transform user-provided AI token usage payloads into StreamEventRequest format.
   *
   * Validates each payload and maps it to the gRPC request format.
   * Invalid payloads are logged and skipped.
   *
   * @param stream - The user's async iterable of AITokenUsagePayload
   * @returns An async iterable of StreamEventRequest payloads
   * @internal
   */
  private async *transformAITokenStream(
    stream: AsyncIterable<AITokenUsagePayload>,
    onError?: EventConsumerErrorCallback
  ) {
    for await (const payload of stream) {
      const rawPayload = {
        userId: payload.userId,
        model: payload.model,
        inputTokens: payload.inputTokens,
        outputTokens: payload.outputTokens,
        inputDebit: payload.inputDebit,
        outputDebit: payload.outputDebit,
        metadata: payload.metadata,
        provider: payload.provider,
        inputCacheTokens: payload.inputCacheTokens,
        inputCacheDebit: payload.inputCacheDebit,
        outputCacheTokens: payload.outputCacheTokens,
        outputCacheDebit: payload.outputCacheDebit,
      };

      // Validate each payload
      const validationResult = AITokenUsagePayloadSchema.safeParse(rawPayload);
      if (!validationResult.success) {
        const errors = validationResult.error.issues
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ");
        log.error(`Invalid AI token usage payload, skipping: ${errors}`);
        this.formatValidationError(
          "AI token usage payload validation failed",
          validationResult.error.issues,
          onError
        );
        continue;
      }

      const validated = validationResult.data;

      // Token context for resolving inputTokens()/outputTokens() placeholders
      const tokenContext = {
        inputTokens: validated.inputTokens,
        outputTokens: validated.outputTokens,
      };

      // Normalize each debit with token resolution
      const inputDebit = normalizeAIDebit(validated.inputDebit, tokenContext);
      const outputDebit = normalizeAIDebit(validated.outputDebit, tokenContext);
      const inputCacheDebit =
        validated.inputCacheDebit !== undefined
          ? normalizeAIDebit(validated.inputCacheDebit, tokenContext)
          : undefined;
      const outputCacheDebit =
        validated.outputCacheDebit !== undefined
          ? normalizeAIDebit(validated.outputCacheDebit, tokenContext)
          : undefined;

      const aiTokenUsage = {
        model: validated.model,
        inputTokens: validated.inputTokens,
        outputTokens: validated.outputTokens,
        inputAmount:
          inputDebit.case === "amount" ? inputDebit.value : undefined,
        inputExpr: inputDebit.case === "expr" ? inputDebit.value : undefined,
        outputAmount:
          outputDebit.case === "amount" ? outputDebit.value : undefined,
        outputExpr: outputDebit.case === "expr" ? outputDebit.value : undefined,
        metadata: validated.metadata
          ? JSON.stringify(validated.metadata)
          : undefined,
        provider: validated.provider ?? undefined,
        inputCacheTokens: validated.inputCacheTokens ?? 0,
        inputCacheAmount:
          inputCacheDebit?.case === "amount"
            ? inputCacheDebit.value
            : undefined,
        inputCacheExpr:
          inputCacheDebit?.case === "expr" ? inputCacheDebit.value : undefined,
        outputCacheTokens: validated.outputCacheTokens ?? 0,
        outputCacheAmount:
          outputCacheDebit?.case === "amount"
            ? outputCacheDebit.value
            : undefined,
        outputCacheExpr:
          outputCacheDebit?.case === "expr"
            ? outputCacheDebit.value
            : undefined,
      } as AITokenUsage;

      const eventId = randomUUID();
      const idempotencyKey = randomUUID();

      const request = {
        type: EventType.AI_TOKEN_USAGE,
        userId: validated.userId,
        reportedTimestamp:
          validated.reportedTimestamp ?? Math.floor(Date.now() / 1000),
        eventId,
        idempotencyKey,
        aiTokenUsage,
      } as StreamEventRequestType;

      yield request;
    }
  }

  /**
   * Wraps the Vercel AI SDK with automatic per-step billing.
   *
   * Returns the AI SDK with `streamText`, `generateText`, `streamObject`,
   * and `generateObject` patched to accept a `userId` parameter and
   * automatically track token usage. All original AI SDK types pass
   * through unchanged — returns the same module shape you passed in,
   * with billing injected.
   *
   * User callbacks (`onStepFinish`, `onFinish`) are chained alongside billing.
   *
   * @param sdk - The Vercel AI SDK module (import * as ai from "ai")
   * @param opts - Default billing configuration for all calls
   *
   * @example
   * ```typescript
   * import * as ai from "ai";
   *
   * const aii = biller.ai(ai, {
   *   inputDebit: { tag: "AI_INPUT" },
   *   outputDebit: { tag: "AI_OUTPUT" },
   * });
   *
   * const result = await aii.streamText({
   *   userId: "user-123",
   *   model: openai("gpt-4o-mini"),
   *   prompt: "Write a story.",
   * });
   * // result.text → Promise<string> (preserved from AI SDK)
   * ```
   */
  ai<const TSDK extends Record<string, unknown>>(
    sdk: TSDK,
    opts: BillableAIOptions<TTags>
  ): WithUserId<TSDK> {
    return createBillableAI(sdk, this, opts) as WithUserId<TSDK>;
  }

  /**
   * Manually track AI token usage from an event callback.
   *
   * Accepts the full event object from `onStepFinish` or `onFinish`
   * and extracts `model` + `usage` automatically.
   *
   * Use this for manual control when you don't want the full `biller.ai()` wrapper.
   *
   * @example
   * ```typescript
   * const result = await ai.streamText({
   *   model: openai("gpt-4o"),
   *   prompt: "Hello",
   *   onStepFinish: event => {
   *     biller.trackAI({
   *       userId: "user-123",
   *       event,
   *       inputDebit: biller.tag("AI_INPUT"),
   *       outputDebit: biller.tag("AI_OUTPUT"),
   *     });
   *   },
   * });
   * ```
   */
  trackAI(config: {
    userId: string;
    event: {
      model: ModelInfo;
      usage?: {
        promptTokens?: number;
        completionTokens?: number;
        totalTokens?: number;
      };
      totalUsage?: {
        promptTokens?: number;
        completionTokens?: number;
        totalTokens?: number;
      };
    };
    inputDebit: Debit<TTags>;
    outputDebit: Debit<TTags>;
    inputCacheDebit?: Debit<TTags>;
    outputCacheDebit?: Debit<TTags>;
    provider?: string;
    metadata?: Record<string, unknown>;
  }): void {
    const {
      userId,
      event,
      inputDebit,
      outputDebit,
      inputCacheDebit,
      outputCacheDebit,
      provider,
      metadata,
    } = config;
    const usage = event.usage ?? event.totalUsage ?? {};
    const model: ModelInfo = event.model;

    const mappedUsage: LanguageModelUsage = {
      inputTokens: usage.promptTokens ?? 0,
      outputTokens: usage.completionTokens ?? 0,
      totalTokens: usage.totalTokens ?? 0,
      inputCachedTokens: 0,
      outputCachedTokens: 0,
    };

    const payload = buildAIPayload(
      userId,
      model,
      mappedUsage,
      { inputDebit, outputDebit, inputCacheDebit, outputCacheDebit, provider },
      {
        inputDebit,
        outputDebit,
        inputCacheDebit: inputCacheDebit ?? inputDebit,
        outputCacheDebit: outputCacheDebit ?? outputDebit,
        provider,
      },
      metadata
    );
    this.aiTokenStreamConsumer(
      (async function* () {
        yield payload;
      })()
    );
  }

  private cachedPublicKey: string | null = null;

  async webhook(request: Request): Promise<WebhookEvent> {
    if (!this.cachedPublicKey) {
      const response = await fetch(
        `${this.httpUrl}/api/v1/internals/webhook-endpoint/public-key`,
        { headers: { Authorization: `Bearer ${this.apiKey}` } }
      );
      if (!response.ok)
        throw new WebhookVerificationError(
          `Failed to fetch public key: ${response.status}`
        );
      const data = (await response.json()) as { publicKey: string };
      this.cachedPublicKey = data.publicKey;
    }
    return verifyWebhook(request, this.cachedPublicKey);
  }
}

/**
 * Configuration for creating a Scrawn instance via {@link scrawn}.
 */
export interface ScrawnInitConfig {
  apiKey: string;
  baseURL: string;
  httpUrl: string;
  secure?: boolean;
  credentials?: import("@grpc/grpc-js").ChannelCredentials;
  tags?: readonly string[];
  expressions?: readonly string[];
  /**
   * Number of automatic retry attempts on transient network errors
   * (UNAVAILABLE, DEADLINE_EXCEEDED). Defaults to 2. Set to 0 to disable.
   * Each event also gets a manual `.retry()` context in the onError callback.
   */
  retryCount?: number;
  /**
   * Optional webhook public key to skip fetching it from the backend.
   * The dashboard displays this key — paste it here to avoid an extra HTTP
   * call on every cold start of biller.webhook().
   */
  webhookPublicKey?: string;
}

/**
 * Create a type-safe Scrawn billing instance.
 *
 * When `tags` or `expressions` are provided as const arrays, the returned
 * instance is parameterized with the union of those names. All pricing
 * methods will be compile-time checked against the known set.
 *
 * @example
 * ```typescript
 * import { scrawn, mul, inputTokens } from '@scrawn/core';
 *
 * const biller = scrawn({
 *   apiKey: process.env.SCRAWN_KEY,
 *   baseURL: process.env.SCRAWN_BASE_URL,
 *   httpUrl: process.env.SCRAWN_HTTP_URL,
 *   tags: ["PREMIUM_CALL", "EXTRA_FEE"] as const,
 *   expressions: ["MY_EXPR"] as const,
 * });
 *
 * biller.basicUsageEventConsumer({
 *   userId: 'u123',
 *   debitExpr: biller.expr("MY_EXPR"),          // persisted expression
 * });
 * biller.basicUsageEventConsumer({
 *   userId: 'u123',
 *   debitExpr: mul(biller.tag("PREMIUM_CALL"), 3), // inline
 * });
 * ```
 */
export function scrawn<
  const TTags extends readonly string[],
  const TExprs extends readonly string[]
>(
  config: ScrawnInitConfig & { tags: TTags; expressions: TExprs }
): Scrawn<TTags[number], TExprs[number]>;
export function scrawn(config: ScrawnInitConfig): Scrawn;
export function scrawn(
  config: ScrawnInitConfig & {
    tags?: readonly string[];
    expressions?: readonly string[];
  }
): Scrawn {
  return new Scrawn({
    apiKey: config.apiKey as AllCredentials["apiKey"],
    baseURL: config.baseURL,
    httpUrl: config.httpUrl,
    secure: config.secure,
    credentials: config.credentials,
    retryCount: config.retryCount,
    webhookPublicKey: config.webhookPublicKey,
  });
}
