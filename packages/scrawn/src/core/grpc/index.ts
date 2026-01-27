/**
 * gRPC abstraction layer - Type-safe fluent API for gRPC calls.
 *
 * This module provides a beautiful, type-safe interface for making gRPC calls
 * with automatic type inference, compile-time validation, and a fluent API.
 *
 * @module grpc
 */

export { GrpcClient } from "./client.js";
export { GrpcCallContext } from "./callContext.js";
export { RequestBuilder } from "./requestBuilder.js";
export { StreamRequestBuilder } from "./streamRequestBuilder.js";
export type {
  ServiceMethodNames,
  MethodInput,
  MethodOutput,
  Headers,
  RequestState,
  MethodKind,
  MethodsOfKind,
  UnaryMethodNames,
  ClientStreamingMethodNames,
  ServerStreamingMethodNames,
  BidiStreamingMethodNames,
} from "./types.js";
