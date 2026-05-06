import * as grpc from "@grpc/grpc-js";
import type { GrpcCallOptions } from "./types.js";
import type { GrpcCallContext } from "./callContext.js";

export class StreamRequestBuilder<C extends grpc.ServiceClientConstructor> {
  private readonly ctx: GrpcCallContext<C>;
  private hasSent = false;
  private options: GrpcCallOptions = {};

  constructor(ctx: GrpcCallContext<C>) {
    this.ctx = ctx;
  }

  addMetadata(key: string, value: string): this {
    this.ctx.addMetadata(key, value);
    return this;
  }

  setOptions(options: GrpcCallOptions): this {
    this.options = { ...this.options, ...options };
    return this;
  }

  async stream<TResponse = unknown>(items: AsyncIterable<unknown>): Promise<TResponse> {
    if (this.hasSent) {
      throw new Error("Stream has already been sent for this request");
    }
    this.hasSent = true;

    this.ctx.logCallStart();

    try {
      const client = new this.ctx.ClientConstructor(
        this.ctx.target,
        this.ctx.credentials
      ) as grpc.Client & Record<string, unknown>;
      const method = client[this.ctx.methodName] as (
        metadata: grpc.Metadata,
        options: grpc.CallOptions,
        callback: (error: grpc.ServiceError | null, response: TResponse) => void
      ) => grpc.ClientWritableStream<unknown>;

      const callOptions: grpc.CallOptions = {};
      if (this.options.deadline !== undefined) {
        callOptions.deadline = this.options.deadline;
      }

      const response = await new Promise<TResponse>((resolve, reject) => {
        const stream = method.call(
          client,
          this.options.metadata ?? this.ctx.getMetadata(),
          callOptions,
          (error, result) => {
            if (error) {
              reject(error);
              return;
            }
            resolve(result);
          }
        );

        (async () => {
          try {
            for await (const item of items) {
              stream.write(item);
            }
            stream.end();
          } catch (error) {
            stream.destroy(error as Error);
          }
        })();
      });

      this.ctx.logCallSuccess();
      return response;
    } catch (error) {
      this.ctx.logCallError(error);
      throw error;
    }
  }
}
