import type * as grpc from "@grpc/grpc-js";

export interface GrpcCallOptions {
  metadata?: grpc.Metadata;
  deadline?: grpc.Deadline;
}

export type ServiceMethodName = string;
