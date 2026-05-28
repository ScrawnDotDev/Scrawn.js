import * as grpc from "@grpc/grpc-js";
import type { GrpcCallOptions } from "./types.js";
import type { GrpcCallContext } from "./callContext.js";
import { initClient, buildCallOptions, getRequestMetadata } from "./utils.js";

export class RequestBuilder<
  C extends { new (...args: any[]): any; serviceName: string }
> {
  private readonly ctx: GrpcCallContext<C>;
  private payload: unknown;
  private hasPayload = false;
  private options: GrpcCallOptions = {};

  constructor(ctx: GrpcCallContext<C>) {
    this.ctx = ctx;
  }

  // fallow-ignore-next-line unused-class-member
  addMetadata(key: string, value: string): this {
    this.ctx.addMetadata(key, value);
    return this;
  }

  addPayload(payload: unknown): this {
    if (this.hasPayload) {
      throw new Error("Payload has already been set for this request");
    }

    this.payload = payload;
    this.hasPayload = true;
    return this;
  }

  // fallow-ignore-next-line unused-class-member
  setOptions(options: GrpcCallOptions): this {
    this.options = { ...this.options, ...options };
    return this;
  }

  // fallow-ignore-next-line unused-class-member
  async request<TResponse = unknown>(): Promise<TResponse> {
    if (!this.hasPayload) {
      throw new Error(
        "Cannot make request without payload. Call addPayload() first."
      );
    }

    this.ctx.logCallStart();

    try {
      const client = initClient(this.ctx);
      const method = client[this.ctx.methodName] as (
        request: unknown,
        metadata: grpc.Metadata,
        options: grpc.CallOptions,
        callback: (error: grpc.ServiceError | null, response: TResponse) => void
      ) => void;

      const callOptions = buildCallOptions(this.options);

      const response = await new Promise<TResponse>((resolve, reject) => {
        method.call(
          client,
          this.payload,
          getRequestMetadata(this.options, this.ctx),
          callOptions,
          (error, response) => {
            if (error) {
              reject(error);
              return;
            }
            resolve(response);
          }
        );
      });
      this.ctx.logCallSuccess();
      return response;
    } catch (error) {
      this.ctx.logCallError(error);
      throw error;
    }
  }
}
