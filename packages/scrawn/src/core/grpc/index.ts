/**
 * gRPC abstraction layer - Type-safe fluent API for gRPC calls.
 *
 * This module provides a beautiful, type-safe interface for making gRPC calls
 * with automatic type inference, compile-time validation, and a fluent API.
 *
 * @module grpc
 */

export { GrpcClient, type GrpcClientOptions } from "./client.js";
export { GrpcCallContext } from "./callContext.js";
export { RequestBuilder } from "./requestBuilder.js";
export { StreamRequestBuilder } from "./streamRequestBuilder.js";
export type { GrpcCallOptions, ServiceMethodName } from "./types.js";
