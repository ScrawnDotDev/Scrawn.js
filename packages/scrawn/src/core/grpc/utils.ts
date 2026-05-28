import * as grpc from "@grpc/grpc-js";
import type { GrpcCallOptions } from "./types.js";
import type { GrpcCallContext } from "./callContext.js";

/**
 * Shared client initializer used by both RequestBuilder and StreamRequestBuilder.
 */
export function initClient<
  C extends { new (...args: any[]): any; serviceName: string }
>(ctx: GrpcCallContext<C>): grpc.Client & Record<string, unknown> {
  return new ctx.ClientConstructor(ctx.target, ctx.credentials) as grpc.Client &
    Record<string, unknown>;
}

/**
 * Shared call-options builder from optional GrpcCallOptions.
 */
export function buildCallOptions(options: GrpcCallOptions): grpc.CallOptions {
  const callOptions: grpc.CallOptions = {};
  if (options.deadline !== undefined) {
    callOptions.deadline = options.deadline;
  }
  return callOptions;
}

/**
 * Shared metadata getter — prefers per-request metadata, falls back to context metadata.
 */
export function getRequestMetadata(
  options: GrpcCallOptions,
  ctx: { getMetadata(): grpc.Metadata }
): grpc.Metadata {
  return options.metadata ?? ctx.getMetadata();
}
