import * as grpc from "@grpc/grpc-js";
import type { GrpcCallOptions } from "./types.js";
import type { GrpcCallContext } from "./callContext.js";
import { initClient, buildCallOptions, getRequestMetadata } from "./utils.js";

export class StreamRequestBuilder<
  C extends { new (...args: any[]): any; serviceName: string }
> {
  private readonly ctx: GrpcCallContext<C>;
  private hasSent = false;
  private options: GrpcCallOptions = {};

  constructor(ctx: GrpcCallContext<C>) {
    this.ctx = ctx;
  }

  // fallow-ignore-next-line unused-class-member
  addMetadata(key: string, value: string): this {
    this.ctx.addMetadata(key, value);
    return this;
  }

  // fallow-ignore-next-line unused-class-member
  setOptions(options: GrpcCallOptions): this {
    this.options = { ...this.options, ...options };
    return this;
  }

  // fallow-ignore-next-line unused-class-member
  async stream<TResponse = unknown>(
    items: AsyncIterable<unknown>
  ): Promise<TResponse> {
    if (this.hasSent) {
      throw new Error("Stream has already been sent for this request");
    }
    this.hasSent = true;

    this.ctx.logCallStart();

    try {
      const client = initClient(this.ctx);
      const method = client[this.ctx.methodName] as (
        metadata: grpc.Metadata,
        options: grpc.CallOptions,
        callback: (error: grpc.ServiceError | null, response: TResponse) => void
      ) => grpc.ClientWritableStream<unknown>;

      const callOptions = buildCallOptions(this.options);

      const response = await new Promise<TResponse>((resolve, reject) => {
        const stream = method.call(
          client,
          getRequestMetadata(this.options, this.ctx),
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
