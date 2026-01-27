/**
 * Type-safe gRPC client abstraction layer.
 *
 * This module provides the main entry point for making gRPC calls with
 * full compile-time type safety and a beautiful fluent API.
 *
 * @example
 * ```typescript
 * const client = new GrpcClient('https://api.scrawn.dev');
 *
 * const response = await client
 *   .newCall(EventService, 'registerEvent')
 *   .addHeader('Authorization', `Bearer ${apiKey}`)
 *   .addHeader('x-request-id', '123')
 *   .addPayload({
 *     type: EventType.SDK_CALL,
 *     userId: 'user_123',
 *     data: { case: 'sdkCall', value: new SDKCall({ sdkCallType: SDKCallType.RAW, debitAmount: 10 }) }
 *   })
 *   .request();
 * ```
 */

import type { Transport } from "@connectrpc/connect";
import type { ServiceType } from "@bufbuild/protobuf";
import { createConnectTransport } from "@connectrpc/connect-node";
import { GrpcCallContext } from "./callContext.js";
import { RequestBuilder } from "./requestBuilder.js";
import { StreamRequestBuilder } from "./streamRequestBuilder.js";
import { ScrawnLogger } from "../../utils/logger.js";
import type { ServiceMethodNames } from "./types.js";
import { ScrawnConfig } from "../../config.js";

const log = new ScrawnLogger("GrpcClient");

/**
 * Main gRPC client for making type-safe API calls.
 *
 * This class manages the underlying transport and provides factory methods
 * for creating type-safe request builders. Each request builder is bound to
 * a specific service and method, ensuring compile-time type safety.
 *
 * The client handles:
 * - Transport configuration (HTTP/1.1)
 * - Request building with fluent API
 * - Header management (auth should be added via .addHeader())
 * - Error handling and logging
 *
 * @example
 * ```typescript
 * // Initialize the client
 * const client = new GrpcClient('https://api.scrawn.dev');
 *
 * // Fetch credentials from your auth system
 * const creds = await getCredentials();
 *
 * // Make a call to EventService.registerEvent
 * const eventResponse = await client
 *   .newCall(EventService, 'registerEvent')
 *   .addHeader('Authorization', `Bearer ${creds.apiKey}`)
 *   .addPayload({ type: EventType.SDK_CALL, userId: 'u123', ... })
 *   .request();
 *
 * // Make a call to AuthService.createAPIKey
 * const authResponse = await client
 *   .newCall(AuthService, 'createAPIKey')
 *   .addHeader('Authorization', `Bearer ${creds.apiKey}`)
 *   .addPayload({ name: 'My Key', expiresIn: 3600n })
 *   .request();
 * ```
 */
export class GrpcClient {
  /** The underlying gRPC transport */
  private readonly transport: Transport;

  /** Base URL for API calls */
  private readonly baseURL: string;

  /**
   * Create a new GrpcClient.
   *
   * @param baseURL - The base URL of the gRPC API (e.g., 'https://api.scrawn.dev')
   *
   * @example
   * ```typescript
   * const client = new GrpcClient('https://api.scrawn.dev');
   * ```
   */
  constructor(baseURL: string) {
    this.baseURL = baseURL;

    log.info(`Initializing gRPC client for ${baseURL}`);

    this.transport = createConnectTransport({
      baseUrl: this.baseURL,
      httpVersion: ScrawnConfig.grpc.httpVersion,
      useBinaryFormat: true, // Use binary protobuf (smaller than JSON)
    });

    log.info(
      `gRPC client initialized with HTTP/${ScrawnConfig.grpc.httpVersion}`
    );
  }

  /**
   * Create a new request builder for a specific service method.
   *
   * This is the entry point for making unary gRPC calls. The method is fully type-safe:
   * - Service parameter must be a valid gRPC service
   * - Method name must exist on the service (autocomplete provided)
   * - Payload type is inferred from the method
   * - Response type is inferred from the method
   *
   * @template S - The gRPC service type (auto-inferred)
   * @template M - The method name (auto-inferred and validated)
   *
   * @param service - The gRPC service definition (e.g., EventService, AuthService)
   * @param method - The method name as a string literal (e.g., 'registerEvent', 'createAPIKey')
   * @returns A new RequestBuilder for chaining headers, payload, and execution
   *
   * @example
   * ```typescript
   * // EventService.registerEvent
   * const eventBuilder = client.newCall(EventService, 'registerEvent');
   * // Payload type is RegisterEventRequest
   * // Response type is RegisterEventResponse
   *
   * // AuthService.createAPIKey
   * const authBuilder = client.newCall(AuthService, 'createAPIKey');
   * // Payload type is CreateAPIKeyRequest
   * // Response type is CreateAPIKeyResponse
   *
   * // Type error - method doesn't exist!
   * // const invalid = client.newCall(EventService, 'nonExistentMethod');
   * ```
   */
  newCall<S extends ServiceType, M extends ServiceMethodNames<S>>(
    service: S,
    method: M
  ): RequestBuilder<S, M> {
    log.debug(
      `Creating new request builder for ${service.typeName}.${String(method)}`
    );
    const ctx = new GrpcCallContext<S, M>(
      this.transport,
      service,
      method,
      "RequestBuilder"
    );
    return new RequestBuilder<S, M>(ctx);
  }

  /**
   * Get the base URL of this client.
   *
   * @returns The base URL string
   */
  getBaseURL(): string {
    return this.baseURL;
  }

  /**
   * Get the underlying transport (for advanced use cases).
   *
   * @returns The Connect transport instance
   * @internal
   */
  getTransport(): Transport {
    return this.transport;
  }

  /**
   * Create a new stream request builder for a client-streaming service method.
   *
   * This is the entry point for making client-streaming gRPC calls. The method is fully type-safe:
   * - Service parameter must be a valid gRPC service
   * - Method name must exist on the service (autocomplete provided)
   * - Payload type is inferred from the method
   * - Response type is inferred from the method
   *
   * @template S - The gRPC service type (auto-inferred)
   * @template M - The method name (auto-inferred and validated)
   *
   * @param service - The gRPC service definition (e.g., EventService)
   * @param method - The method name as a string literal (e.g., 'streamEvents')
   * @returns A new StreamRequestBuilder for chaining headers and streaming payloads
   *
   * @example
   * ```typescript
   * // EventService.streamEvents (client-streaming)
   * const response = await client
   *   .newStreamCall(EventService, 'streamEvents')
   *   .addHeader('Authorization', `Bearer ${apiKey}`)
   *   .stream(asyncIterableOfEvents);
   * // Response type is StreamEventResponse
   * ```
   */
  newStreamCall<S extends ServiceType, M extends ServiceMethodNames<S>>(
    service: S,
    method: M
  ): StreamRequestBuilder<S, M> {
    log.debug(
      `Creating new stream request builder for ${service.typeName}.${String(method)}`
    );
    const ctx = new GrpcCallContext<S, M>(
      this.transport,
      service,
      method,
      "StreamRequestBuilder"
    );
    return new StreamRequestBuilder<S, M>(ctx);
  }
}
