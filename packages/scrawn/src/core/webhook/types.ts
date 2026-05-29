export interface BillingAddress {
  country: string;
  city?: string | null;
  state?: string | null;
  street?: string | null;
  zipcode?: string | null;
}

export interface CustomerLimitedDetails {
  customer_id: string;
  email: string;
  name: string;
  phone_number?: string | null;
  metadata?: { [key: string]: string };
}

export type IntentStatus =
  | "succeeded"
  | "failed"
  | "cancelled"
  | "processing"
  | "requires_customer_action"
  | "requires_merchant_action"
  | "requires_payment_method"
  | "requires_confirmation"
  | "requires_capture"
  | "partially_captured"
  | "partially_captured_and_capturable";

export interface DodoPaymentData {
  billing: BillingAddress;
  brand_id: string;
  business_id: string;
  created_at: string;
  currency: string;
  customer: CustomerLimitedDetails;
  digital_products_delivered: boolean;
  metadata: { [key: string]: string };
  payment_id: string;
  total_amount: number;
  status?: IntentStatus | null;
  subscription_id?: string | null;
  tax?: number | null;
  updated_at?: string | null;
  invoice_id?: string | null;
  invoice_url?: string | null;
  payment_method?: string | null;
  payment_method_type?: string | null;
  discount_id?: string | null;
  discount_ids?: string[] | null;
  product_cart?: Array<{
    product_id: string;
    quantity: number;
  }>;
  refund_status?: string | null;
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
