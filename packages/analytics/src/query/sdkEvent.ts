import { BaseEventBuilder } from "./base.js";
import type { GrpcClient } from "@scrawn/core";
import { sdkEventFields } from "./fields.js";

export class SdkEventBuilder extends BaseEventBuilder<typeof sdkEventFields> {
  constructor(grpc: GrpcClient, apiKey: string) {
    super(sdkEventFields, "SDK_CALL", grpc, apiKey);
  }
}
