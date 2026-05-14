import { BaseEventBuilder } from "./base.ts";
import type { GrpcClient } from "@scrawn/core";
import { sdkEventFields } from "./fields.ts";

export class SdkEventBuilder extends BaseEventBuilder<typeof sdkEventFields> {
  constructor(grpc: GrpcClient, apiKey: string) {
    super(sdkEventFields, "SDK_CALL", grpc, apiKey);
  }
}
