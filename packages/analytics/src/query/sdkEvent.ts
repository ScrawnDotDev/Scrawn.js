import { BaseEventBuilder } from "./base.ts";
import { callEventQuery } from "../grpc/client.ts";
import type { GrpcClient } from "@scrawn/core";
import type { EventQueryResult } from "./types.ts";
import { sdkEventFields } from "./fields.ts";

export class SdkEventBuilder extends BaseEventBuilder<typeof sdkEventFields> {
  constructor(private grpc: GrpcClient, private apiKey: string) {
    super(sdkEventFields, "SDK_CALL");
  }

  async execute(): Promise<EventQueryResult> {
    const params = this.buildParams();
    const res = await callEventQuery(this.grpc, this.apiKey, params);
    if (this._aggregation) return { rows: res.aggRowsList ?? [], total: res.total ?? 0 };
    return { rows: res.rowsList ?? [], total: res.total ?? 0 };
  }
}



