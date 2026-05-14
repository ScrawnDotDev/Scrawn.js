import { FieldRef } from "../fieldRef.ts";
import { BaseEventBuilder } from "./base.ts";
import { callEventQuery } from "../grpc/client.ts";
import type { GrpcClient } from "@scrawn/core";
import type { EventQueryResult } from "./types.ts";

class SdkEventFields {
  eventId = new FieldRef<string>("eventId");
  userId = new FieldRef<string>("userId");
  apiKeyId = new FieldRef<string>("apiKeyId");
  reportedTimestamp = new FieldRef<string>("reportedTimestamp");
  ingestedTimestamp = new FieldRef<string>("ingestedTimestamp");
  sdkCallType = new FieldRef<string>("sdkCallType");
  debitAmount = new FieldRef<number>("debitAmount");
}

export class SdkEventBuilder extends BaseEventBuilder<SdkEventFields> {
  constructor(private grpc: GrpcClient, private apiKey: string) {
    super(new SdkEventFields());
  }

  async execute(): Promise<EventQueryResult> {
    const params = this.buildParams();
    const res = await callEventQuery(this.grpc, this.apiKey, params);
    return { rows: res.rowsList ?? [], total: res.total ?? 0 };
  }
}



