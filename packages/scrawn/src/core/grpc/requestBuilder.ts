/**
 * Type-safe fluent API for building and executing unary gRPC requests.
 *
 * This module provides a chain-able interface that ensures:
 * - Compile-time type safety for all operations
 * - Autocomplete for service methods and payload fields
 * - Runtime validation of request state
 * - Clean separation of concerns
 *
 * @example
 * ```typescript
 * const response = await client
 *   .newCall(EventService, 'registerEvent')
 *   .addHeader('x-request-id', '123')
 *   .addPayload({
 *     type: EventType.SDK_CALL,
 *     userId: 'user_123',
 *     data: { case: 'sdkCall', value: { sdkCallType: SDKCallType.RAW, debitAmount: 10 } }
 *   })
 *   .request();
 * ```
 */

import type { ServiceType } from "@bufbuild/protobuf";
import type {
  ServiceMethodNames,
  MethodInput,
  MethodOutput,
  RequestState,
  UnaryMethodFn,
} from "./types.js";
import type { GrpcCallContext } from "./callContext.js";

/**
 * Builder for constructing type-safe unary gRPC requests.
 *
 * This class implements a fluent interface where each method returns `this`,
 * allowing for method chaining. Type parameters ensure that the payload type
 * matches the selected service method at compile time.
 *
 * @template S - The gRPC service type
 * @template M - The method name on the service (string literal)
 */
export class RequestBuilder<
  S extends ServiceType,
  M extends ServiceMethodNames<S>,
> {
  private readonly ctx: GrpcCallContext<S, M>;
  private payload: MethodInput<S, M> | null = null;
  private readonly state: RequestState = { hasPayload: false };

  /**
   * @internal
   * Constructs a new RequestBuilder. Use GrpcClient.newCall() instead.
   *
   * @param ctx - The shared call context (injected by GrpcClient)
   */
  constructor(ctx: GrpcCallContext<S, M>) {
    this.ctx = ctx;
  }

  /**
   * Add a header to the request.
   *
   * Headers are sent with the gRPC call and can be used for authentication,
   * tracing, or custom metadata. This method can be called multiple times
   * to add multiple headers.
   *
   * @param key - Header name (e.g., 'authorization', 'x-request-id')
   * @param value - Header value
   * @returns The builder instance for chaining
   *
   * @example
   * ```typescript
   * builder
   *   .addHeader('authorization', 'Bearer token123')
   *   .addHeader('x-request-id', 'abc-def-123')
   * ```
   */
  addHeader(key: string, value: string): this {
    this.ctx.addHeader(key, value);
    return this;
  }

  /**
   * Set the request payload.
   *
   * The payload type is automatically inferred from the service method,
   * providing full autocomplete and type checking. This method can only
   * be called once per request to prevent accidental overwrites.
   *
   * @param payload - The request payload (type-checked against the method's input type)
   * @returns The builder instance for chaining
   * @throws Error if payload has already been set
   *
   * @example
   * ```typescript
   * builder.addPayload({
   *   type: EventType.SDK_CALL,
   *   userId: 'user_123',
   *   data: {
   *     case: 'sdkCall',
   *     value: {
   *       sdkCallType: SDKCallType.RAW,
   *       debitAmount: 10
   *     }
   *   }
   * })
   * ```
   */
  addPayload(
    payload: MethodInput<S, M> extends infer T ? Partial<T> : never
  ): this {
    if (this.state.hasPayload) {
      throw new Error(
        "Payload has already been set. Cannot add payload multiple times. " +
          "Create a new request builder if you need to make another call."
      );
    }

    this.payload = payload as unknown as MethodInput<S, M>;
    this.state.hasPayload = true;
    return this;
  }

  /**
   * Execute the gRPC request.
   *
   * Validates that a payload has been set, then makes the actual gRPC call
   * using the configured service, method, headers, and payload. The response
   * type is automatically inferred from the service method.
   *
   * @returns A promise that resolves to the typed response
   * @throws Error if no payload has been set
   * @throws Error if the gRPC call fails
   *
   * @example
   * ```typescript
   * const response = await builder
   *   .addPayload({ userId: 'user_123', ... })
   *   .request();
   *
   * // response is fully typed based on the method's output type
   * console.log(response.random);
   * ```
   */
  async request(): Promise<MethodOutput<S, M>> {
    if (!this.state.hasPayload || this.payload === null) {
      throw new Error(
        "Cannot make request without payload. Call addPayload() first."
      );
    }

    try {
      this.ctx.logCallStart();
      this.ctx.log.debug(`Payload: ${JSON.stringify(this.payload)}`);

      // The actual gRPC call.
      // Type assertion is required because TypeScript cannot track the relationship
      // between a dynamic key access and the resulting function signature in mapped types.
      // This is safe because:
      // 1. methodName is constrained to ServiceMethodNames<S>
      // 2. MethodInput/MethodOutput are derived from the same service definition
      const method = this.ctx.client[this.ctx.methodName] as UnaryMethodFn<
        MethodInput<S, M>,
        MethodOutput<S, M>
      >;
      const response = await method(this.payload, {
        headers: this.ctx.getHeaders(),
      });

      this.ctx.logCallSuccess();
      return response;
    } catch (error) {
      this.ctx.logCallError(error);
      throw error;
    }
  }
}
