/**
 * Core type system for the gRPC client abstraction layer.
 * 
 * This module provides compile-time type safety for all gRPC operations,
 * ensuring that payloads, headers, and responses are correctly typed based
 * on the service and method being called.
 */

import type { ServiceType } from '@bufbuild/protobuf';
import type { MessageType } from '@bufbuild/protobuf';

/**
 * Extract all method names from a service as a union of string literals.
 * This provides autocomplete and compile-time validation of method names.
 */
export type ServiceMethodNames<S extends ServiceType> = keyof S['methods'] & string;

/**
 * Get the input MessageType (constructor) for a specific method on a service.
 */
export type MethodInputType<
  S extends ServiceType,
  M extends ServiceMethodNames<S>
> = S['methods'][M] extends { I: infer I } ? I : never;

/**
 * Get the output MessageType (constructor) for a specific method on a service.
 */
export type MethodOutputType<
  S extends ServiceType,
  M extends ServiceMethodNames<S>
> = S['methods'][M] extends { O: infer O } ? O : never;

/**
 * Convert a MessageType to its Message instance type.
 * This extracts the actual Message type from a MessageType constructor.
 */
export type MessageTypeToMessage<T> = T extends MessageType<infer M> ? M : never;

/**
 * Get the input Message type for a specific method on a service.
 * This is what you'll use for the payload type.
 */
export type MethodInput<
  S extends ServiceType,
  M extends ServiceMethodNames<S>
> = MessageTypeToMessage<MethodInputType<S, M>>;

/**
 * Get the output Message type for a specific method on a service.
 * This is what you'll get back from the request.
 */
export type MethodOutput<
  S extends ServiceType,
  M extends ServiceMethodNames<S>
> = MessageTypeToMessage<MethodOutputType<S, M>>;

/**
 * HTTP headers as key-value pairs.
 */
export interface Headers {
  [key: string]: string;
}

/**
 * State tracking for the request builder to prevent duplicate operations.
 */
export interface RequestState {
  hasPayload: boolean;
}

/**
 * Represents the kind of a gRPC method.
 * Connect RPC method info includes `kind` with these values.
 */
export type MethodKind = 'unary' | 'server_streaming' | 'client_streaming' | 'bidi_streaming';

/**
 * Extract methods of a specific kind from a service.
 * 
 * @template S - The gRPC service type
 * @template K - The method kind to filter by
 */
export type MethodsOfKind<
  S extends ServiceType,
  K extends MethodKind
> = {
  [M in keyof S['methods'] & string]: S['methods'][M] extends { kind: infer MK }
    ? MK extends K
      ? M
      : never
    : never;
}[keyof S['methods'] & string];

/**
 * Extract unary method names from a service.
 * Unary methods accept a single request and return a single response.
 */
export type UnaryMethodNames<S extends ServiceType> = MethodsOfKind<S, 'unary'>;

/**
 * Extract client-streaming method names from a service.
 * Client-streaming methods accept a stream of requests and return a single response.
 */
export type ClientStreamingMethodNames<S extends ServiceType> = MethodsOfKind<S, 'client_streaming'>;

/**
 * Extract server-streaming method names from a service.
 * Server-streaming methods accept a single request and return a stream of responses.
 */
export type ServerStreamingMethodNames<S extends ServiceType> = MethodsOfKind<S, 'server_streaming'>;

/**
 * Extract bidirectional-streaming method names from a service.
 * Bidi-streaming methods accept a stream of requests and return a stream of responses.
 */
export type BidiStreamingMethodNames<S extends ServiceType> = MethodsOfKind<S, 'bidi_streaming'>;

/**
 * Options passed to gRPC method calls.
 * Matches CallOptions from @connectrpc/connect.
 */
export interface GrpcCallOptions {
  headers?: Headers;
  signal?: AbortSignal;
  timeoutMs?: number;
  onHeader?: (headers: globalThis.Headers) => void;
  onTrailer?: (trailers: globalThis.Headers) => void;
}

/**
 * Function signature for a unary gRPC method.
 * Takes a partial message and options, returns a promise of the response.
 * 
 * @template I - Input message type
 * @template O - Output message type
 */
export type UnaryMethodFn<I, O> = (
  request: Partial<I>,
  options?: GrpcCallOptions
) => Promise<O>;

/**
 * Function signature for a client-streaming gRPC method.
 * Takes an async iterable of partial messages and options, returns a promise of the response.
 * 
 * @template I - Input message type
 * @template O - Output message type
 */
export type ClientStreamingMethodFn<I, O> = (
  request: AsyncIterable<Partial<I>>,
  options?: GrpcCallOptions
) => Promise<O>;

/**
 * Get the method function type from a Client for a specific method.
 * This properly extracts the callable type for dynamic method access.
 * 
 * Note: Due to TypeScript limitations with mapped types and dynamic keys,
 * this type is used with type assertions when accessing client methods
 * via computed property names. The assertion is safe because:
 * 1. The method name M is constrained to ServiceMethodNames<S>
 * 2. The input/output types are derived from the same service definition
 * 
 * @template S - The gRPC service type
 * @template M - The method name on the service
 */
export type ClientMethod<
  S extends ServiceType,
  M extends ServiceMethodNames<S>
> = S['methods'][M] extends { kind: 'unary' }
  ? UnaryMethodFn<MethodInput<S, M>, MethodOutput<S, M>>
  : S['methods'][M] extends { kind: 'client_streaming' }
  ? ClientStreamingMethodFn<MethodInput<S, M>, MethodOutput<S, M>>
  : never;
