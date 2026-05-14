import { BaseEventBuilder } from "./base.ts";
import { callEventQuery } from "../grpc/client.ts";
import type { GrpcClient } from "@scrawn/core";
import type { EventListResult, EventAggResult } from "./types.ts";
import { aiTokenFields } from "./fields.ts";

export class AiTokenBuilder extends BaseEventBuilder<typeof aiTokenFields> {
  constructor(private grpc: GrpcClient, private apiKey: string) {
    super(aiTokenFields, "AI_TOKEN_USAGE");
  }

  async execute(): Promise<EventListResult | EventAggResult> {
    const params = this.buildParams();
    const res = await callEventQuery(this.grpc, this.apiKey, params);
    if (this._aggregation) return { rows: res.aggRowsList ?? [], total: res.total ?? 0 };
    return { rows: res.rowsList ?? [], total: res.total ?? 0 };
  }
}
