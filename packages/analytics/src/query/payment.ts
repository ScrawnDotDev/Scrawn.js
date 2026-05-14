import { BaseEventBuilder } from "./base.ts";
import { callEventQuery } from "../grpc/client.ts";
import type { GrpcClient } from "@scrawn/core";
import type { EventListResult, EventAggResult } from "./types.ts";
import { paymentFields } from "./fields.ts";

export class PaymentBuilder extends BaseEventBuilder<typeof paymentFields> {
  constructor(private grpc: GrpcClient, private apiKey: string) {
    super(paymentFields, "PAYMENT");
  }

  async execute(): Promise<EventListResult | EventAggResult> {
    const params = this.buildParams();
    const res = await callEventQuery(this.grpc, this.apiKey, params);
    if (this._aggregation) return { rows: res.aggRowsList ?? [], total: res.total ?? 0 };
    return { rows: res.rowsList ?? [], total: res.total ?? 0 };
  }
}
