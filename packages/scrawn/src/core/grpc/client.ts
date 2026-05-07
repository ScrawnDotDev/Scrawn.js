import * as grpc from "@grpc/grpc-js";
import { GrpcCallContext } from "./callContext.js";
import { RequestBuilder } from "./requestBuilder.js";
import { StreamRequestBuilder } from "./streamRequestBuilder.js";
import { ScrawnLogger } from "../../utils/logger.js";

const log = new ScrawnLogger("GrpcClient");

export interface GrpcClientOptions {
  secure?: boolean;
  credentials?: grpc.ChannelCredentials;
}

export class GrpcClient {
  private readonly target: string;
  private readonly credentials: grpc.ChannelCredentials;

  constructor(target: string, options?: GrpcClientOptions) {
    if (!target || !target.includes(":")) {
      throw new Error(
        `Invalid target format: ${target}. Expected host:port format.`
      );
    }

    this.target = target;
    this.credentials =
      options?.credentials ??
      (options?.secure
        ? grpc.credentials.createSsl()
        : grpc.credentials.createInsecure());

    log.info(
      `Initialized gRPC client for ${target} (${options?.secure ? "secure" : "insecure"})`
    );
  }

  newCall<C extends grpc.ServiceClientConstructor>(
    client: C,
    method: string
  ): RequestBuilder<C> {
    return new RequestBuilder(
      new GrpcCallContext(this.target, this.credentials, client, method, "RequestBuilder")
    );
  }

  newStreamCall<C extends grpc.ServiceClientConstructor>(
    client: C,
    method: string
  ): StreamRequestBuilder<C> {
    return new StreamRequestBuilder(
      new GrpcCallContext(this.target, this.credentials, client, method, "StreamRequestBuilder")
    );
  }

  getTarget(): string {
    return this.target;
  }
}
