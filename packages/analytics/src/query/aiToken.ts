import { FieldRef } from "../fieldRef.ts";
import { BaseEventBuilder } from "./base.ts";
import { callEventQuery } from "../grpc/client.ts";
import type { GrpcClient } from "@scrawn/core";
import type { EventQueryResult } from "./types.ts";

class AiTokenFields {
  eventId = new FieldRef<string>("eventId");
  userId = new FieldRef<string>("userId");
  apiKeyId = new FieldRef<string>("apiKeyId");
  reportedTimestamp = new FieldRef<string>("reportedTimestamp");
  ingestedTimestamp = new FieldRef<string>("ingestedTimestamp");
  model = new FieldRef<string>("model");
  inputTokens = new FieldRef<number>("inputTokens");
  outputTokens = new FieldRef<number>("outputTokens");
  inputDebitAmount = new FieldRef<number>("inputDebitAmount");
  outputDebitAmount = new FieldRef<number>("outputDebitAmount");
}

export class AiTokenBuilder extends BaseEventBuilder<AiTokenFields> {
  constructor(private grpc: GrpcClient) {
    super(new AiTokenFields());
  }

  async execute(): Promise<EventQueryResult> {
    const params = this.buildParams();
    const res = await callEventQuery(this.grpc, params);
    return { rows: res.rowsList ?? [], total: res.total ?? 0 };
  }
}



