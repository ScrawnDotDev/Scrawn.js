/**
 * Shared call context for gRPC request builders.
 *
 * This module encapsulates the common state and operations used by both
 * `RequestBuilder` (unary) and `StreamRequestBuilder` (client-streaming),
 * eliminating code duplication while keeping each builder focused on its
 * specific execution model.
 *
 * Design:
 * - The context is immutable after construction; headers are accumulated via
 *   a mutable map owned by the context but exposed through a controlled API.
 * - Builders receive the context via constructor injection and delegate header
 *   management and logging to it.
 * - The context does NOT own payload or execution logic; those remain in the
 *   individual builders to preserve separation of concerns.
 */

import type { Client, Transport } from "@connectrpc/connect";
import type { ServiceType } from "@bufbuild/protobuf";
import { createClient } from "@connectrpc/connect";
import { ScrawnLogger } from "../../utils/logger.js";
import type { ServiceMethodNames, Headers } from "./types.js";

/**
 * Shared context for a single gRPC call.
 *
 * Holds the typed client, method name, headers, and logger. Provides helper
 * methods used by both unary and streaming request builders.
 *
 * @template S - The gRPC service type
 * @template M - The method name on the service (string literal)
 */
export class GrpcCallContext<
  S extends ServiceType,
  M extends ServiceMethodNames<S>,
> {
  /** The typed Connect client for the service */
  public readonly client: Client<S>;

  /** The method name being invoked */
  public readonly methodName: M;

  /** Accumulated headers for the call */
  private readonly headers: Headers = {};

  /** Logger scoped to the builder type */
  public readonly log: ScrawnLogger;

  /**
   * Constructs a new GrpcCallContext.
   *
   * @param transport - The Connect transport to use
   * @param service - The gRPC service definition
   * @param methodName - The method to invoke
   * @param loggerName - Name for the logger (e.g., 'RequestBuilder')
   */
  constructor(
    transport: Transport,
    service: S,
    methodName: M,
    loggerName: string
  ) {
    this.client = createClient(service, transport);
    this.methodName = methodName;
    this.log = new ScrawnLogger(loggerName);
  }

  /**
   * Add a header to the call.
   *
   * @param key - Header name
   * @param value - Header value
   */
  addHeader(key: string, value: string): void {
    this.headers[key] = value;
  }

  /**
   * Get a shallow copy of the current headers.
   * Used when making the actual gRPC call.
   */
  getHeaders(): Headers {
    return { ...this.headers };
  }

  /**
   * Log the start of a call (info level).
   */
  logCallStart(): void {
    this.log.info(`Making gRPC call to ${String(this.methodName)}`);
    this.log.debug(`Headers: ${JSON.stringify(this.headers)}`);
  }

  /**
   * Log successful completion of a call (info level).
   */
  logCallSuccess(): void {
    this.log.info(
      `Successfully completed gRPC call to ${String(this.methodName)}`
    );
  }

  /**
   * Log a call failure (error level).
   *
   * @param error - The error that occurred
   */
  logCallError(error: unknown): void {
    this.log.error(
      `gRPC call to ${String(this.methodName)} failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
