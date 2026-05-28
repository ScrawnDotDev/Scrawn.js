export interface PaymentSucceededData {
  paymentId: string;
  checkoutSessionId: string;
  userId: string;
  amount: number;
  currency: string;
  mode: "test" | "production";
  billed_upto: string;
  createdAt: string;
}

export interface PaymentFailedData {
  paymentId: string;
  checkoutSessionId: string;
  userId: string;
  mode: "test" | "production";
  createdAt: string;
}

export type WebhookEvent =
  | {
      id: string;
      timestamp: string;
      resource: "payment";
      action: "succeeded";
      data: PaymentSucceededData;
    }
  | {
      id: string;
      timestamp: string;
      resource: "payment";
      action: "failed";
      data: PaymentFailedData;
    };

export function parseEventType(
  type: string
): { resource: string; action: string } | null {
  const parts = type.split(".");
  if (parts.length < 2) return null;
  const action = parts.pop()!;
  const resource = parts.join(".");
  return { resource, action };
}
