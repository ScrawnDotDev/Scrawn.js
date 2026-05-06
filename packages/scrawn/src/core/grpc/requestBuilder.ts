import * as grpc from "@grpc/grpc-js";
import type { GrpcCallOptions } from "./types.js";
import type { GrpcCallContext } from "./callContext.js";

export class RequestBuilder<C extends grpc.ServiceClientConstructor> {
  private readonly ctx: GrpcCallContext<C>;
  private payload: unknown;
  private hasPayload = false;
  private options: GrpcCallOptions = {};

  constructor(ctx: GrpcCallContext<C>) {
    this.ctx = ctx;
  }

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

  setOptions(options: GrpcCallOptions): this {
    this.options = { ...this.options, ...options };
    return this;
  }

  async request<TResponse = unknown>(): Promise<TResponse> {
    if (!this.hasPayload) {
      throw new Error("Cannot make request without payload. Call addPayload() first.");
    }

    this.ctx.logCallStart();

    try {
      const client = new this.ctx.ClientConstructor(
        this.ctx.target,
        this.ctx.credentials
      ) as grpc.Client & Record<string, unknown>;
      const method = client[this.ctx.methodName] as (
        request: unknown,
        metadata: grpc.Metadata,
        options: grpc.CallOptions,
        callback: (error: grpc.ServiceError | null, response: TResponse) => void
      ) => void;

      const callOptions: grpc.CallOptions = {};
      if (this.options.deadline !== undefined) {
        callOptions.deadline = this.options.deadline;
      }

      const response = await new Promise<TResponse>((resolve, reject) => {
        method.call(
          client,
          this.payload,
          this.options.metadata ?? this.ctx.getMetadata(),
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
