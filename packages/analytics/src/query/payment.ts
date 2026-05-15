import { BaseEventBuilder } from "./base.js";
import type { GrpcClient } from "@scrawn/core";
import { paymentFields } from "./fields.js";

export class PaymentBuilder extends BaseEventBuilder<typeof paymentFields> {
  constructor(grpc: GrpcClient, apiKey: string) {
    super(paymentFields, "PAYMENT", grpc, apiKey);
  }
}
