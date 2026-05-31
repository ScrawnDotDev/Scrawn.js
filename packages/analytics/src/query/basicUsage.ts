import { BaseEventBuilder } from "./base.js";
import type { GrpcClient } from "@scrawn/core";
import { basicUsageFields } from "./fields.js";

export class BasicUsageBuilder extends BaseEventBuilder<
  typeof basicUsageFields
> {
  constructor(grpc: GrpcClient, apiKey: string) {
    super(basicUsageFields, "BASIC_USAGE", grpc, apiKey);
  }
}
