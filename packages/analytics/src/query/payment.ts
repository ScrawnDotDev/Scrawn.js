import { BaseEventBuilder } from "./base.ts";
import type { GrpcClient } from "@scrawn/core";
import { paymentFields } from "./fields.ts";

export class PaymentBuilder extends BaseEventBuilder<typeof paymentFields> {
  constructor(grpc: GrpcClient, apiKey: string) {
    super(paymentFields, "PAYMENT", grpc, apiKey);
  }
}
