export interface DodoPaymentData {
  id: string;
  payment_id: string;
  checkout_session_id: string;
  total_amount: number;
  currency: string;
  business_id: string;
  status: string;
  customer?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface DodoPaymentSucceededEvent {
  business_id: string;
  data: DodoPaymentData;
  timestamp: string;
  type: "payment.succeeded";
}

export interface DodoPaymentFailedEvent {
  business_id: string;
  data: Record<string, unknown>;
  timestamp: string;
  type: "payment.failed";
}

export interface PaymentSucceededData {
  paymentId: string;
  checkoutSessionId: string;
  userId: string;
  amount: number;
  currency: string;
  mode: "test" | "production";
  billed_upto: string;
  createdAt: string;
  raw_data: DodoPaymentSucceededEvent;
}

export interface PaymentFailedData {
  paymentId: string;
  checkoutSessionId: string;
  userId: string;
  mode: "test" | "production";
  createdAt: string;
  raw_data: DodoPaymentFailedEvent;
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
