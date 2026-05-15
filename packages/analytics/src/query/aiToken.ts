import { BaseEventBuilder } from "./base.js";
import type { GrpcClient } from "@scrawn/core";
import { aiTokenFields } from "./fields.js";

export class AiTokenBuilder extends BaseEventBuilder<typeof aiTokenFields> {
  constructor(grpc: GrpcClient, apiKey: string) {
    super(aiTokenFields, "AI_TOKEN_USAGE", grpc, apiKey);
  }
}
