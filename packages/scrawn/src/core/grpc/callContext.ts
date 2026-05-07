import * as grpc from "@grpc/grpc-js";
import { ScrawnLogger } from "../../utils/logger.js";

export class GrpcCallContext<C extends grpc.ServiceClientConstructor> {
  public readonly ClientConstructor: C;
  public readonly methodName: string;
  public readonly target: string;
  public readonly credentials: grpc.ChannelCredentials;
  public readonly log: ScrawnLogger;
  private readonly metadata = new grpc.Metadata();

  constructor(
    target: string,
    credentials: grpc.ChannelCredentials,
    ClientConstructor: C,
    methodName: string,
    loggerName: string
  ) {
    this.target = target;
    this.credentials = credentials;
    this.ClientConstructor = ClientConstructor;
    this.methodName = methodName;
    this.log = new ScrawnLogger(loggerName);
  }

  addMetadata(key: string, value: string): void {
    this.metadata.set(key, value);
  }

  getMetadata(): grpc.Metadata {
    const copy = new grpc.Metadata();
    for (const [key, values] of Object.entries(this.metadata.getMap())) {
      copy.set(key, values);
    }
    return copy;
  }

  getServiceName(): string {
    return this.ClientConstructor.serviceName;
  }

  logCallStart(): void {
    this.log.info(
      `Making gRPC call to ${this.getServiceName()}.${this.methodName}`
    );
  }

  logCallSuccess(): void {
    this.log.info(
      `Successfully completed gRPC call to ${this.getServiceName()}.${this.methodName}`
    );
  }

  logCallError(error: unknown): void {
    this.log.error(
      `gRPC call to ${this.getServiceName()}.${this.methodName} failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
