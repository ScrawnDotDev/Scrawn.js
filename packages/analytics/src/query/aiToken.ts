import { BaseEventBuilder } from "./base.ts";
import type { GrpcClient } from "@scrawn/core";
import { aiTokenFields } from "./fields.ts";

export class AiTokenBuilder extends BaseEventBuilder<typeof aiTokenFields> {
  constructor(grpc: GrpcClient, apiKey: string) {
    super(aiTokenFields, "AI_TOKEN_USAGE", grpc, apiKey);
  }
}
