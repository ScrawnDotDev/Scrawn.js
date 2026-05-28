import { createVerify } from "node:crypto";
import { parseEventType } from "./types.js";
import type { WebhookEvent } from "./types.js";

export type { WebhookEvent } from "./types.js";
export type { PaymentSucceededData, PaymentFailedData } from "./types.js";

export class WebhookVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebhookVerificationError";
  }
}

function extractWebhookHeaders(headers: Headers | Record<string, string>): {
  webhookId: string;
  webhookTimestamp: string;
  webhookSignature: string;
} {
  const get = (key: string): string | undefined => {
    if (headers instanceof Headers) {
      const val = headers.get(key);
      return val ?? undefined;
    }
    return (headers as Record<string, string>)[key];
  };

  const webhookId = get("webhook-id");
  const webhookTimestamp = get("webhook-timestamp");
  const webhookSignature = get("webhook-signature");

  if (!webhookId)
    throw new WebhookVerificationError("Missing webhook-id header");
  if (!webhookTimestamp)
    throw new WebhookVerificationError("Missing webhook-timestamp header");
  if (!webhookSignature)
    throw new WebhookVerificationError("Missing webhook-signature header");

  return { webhookId, webhookTimestamp, webhookSignature };
}

function publicKeyPrefixedToPem(prefixedKey: string): string {
  const base64Key = prefixedKey.replace("whpk_", "");
  return `-----BEGIN PUBLIC KEY-----\n${base64Key}\n-----END PUBLIC KEY-----`;
}

function verifyEd25519(
  payload: string,
  signatureBase64: string,
  publicKeyPem: string
): boolean {
  try {
    const verifier = createVerify("ed25519");
    verifier.update(payload);
    verifier.end();
    return verifier.verify(publicKeyPem, signatureBase64, "base64");
  } catch {
    return false;
  }
}

function verifyWebhookSignature(
  rawBody: string,
  headers: ReturnType<typeof extractWebhookHeaders>,
  publicKeyPrefixed: string,
  toleranceSeconds: number = 300
): { id: string; timestamp: string } {
  const { webhookId, webhookTimestamp, webhookSignature } = headers;

  if (webhookSignature.startsWith("v1a,")) {
    const signature = webhookSignature.slice("v1a,".length);
    const signedPayload = `${webhookId}.${webhookTimestamp}.${rawBody}`;
    const publicKeyPem = publicKeyPrefixedToPem(publicKeyPrefixed);
    const isValid = verifyEd25519(signedPayload, signature, publicKeyPem);
    if (!isValid)
      throw new WebhookVerificationError("Invalid webhook signature");
  } else {
    throw new WebhookVerificationError(
      `Unsupported signature version: expected v1a, got ${
        webhookSignature.split(",")[0]
      }`
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const timestamp = parseInt(webhookTimestamp, 10);
  if (Number.isNaN(timestamp))
    throw new WebhookVerificationError("Invalid webhook-timestamp");

  if (Math.abs(now - timestamp) > toleranceSeconds) {
    throw new WebhookVerificationError(
      `Webhook timestamp outside tolerance (${Math.abs(
        now - timestamp
      )}s > ${toleranceSeconds}s)`
    );
  }

  return { id: webhookId, timestamp: new Date(timestamp * 1000).toISOString() };
}

export async function verifyWebhook(
  request: Request,
  publicKey: string
): Promise<WebhookEvent> {
  const rawBody = await request.text();
  const headers = extractWebhookHeaders(request.headers);
  const { id, timestamp } = verifyWebhookSignature(
    rawBody,
    headers,
    publicKey,
    300
  );

  let parsed: { type: string; data: Record<string, unknown> };
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    throw new WebhookVerificationError("Invalid webhook body: not valid JSON");
  }

  if (!parsed.type || typeof parsed.type !== "string") {
    throw new WebhookVerificationError(
      "Invalid webhook body: missing 'type' field"
    );
  }

  const parsedType = parseEventType(parsed.type);
  if (!parsedType) {
    throw new WebhookVerificationError(
      `Invalid event type format: ${parsed.type}`
    );
  }

  switch (parsed.type) {
    case "payment.succeeded":
      return {
        id,
        timestamp,
        resource: "payment" as const,
        action: "succeeded" as const,
        data: parsed.data,
      } as unknown as WebhookEvent;
    case "payment.failed":
      return {
        id,
        timestamp,
        resource: "payment" as const,
        action: "failed" as const,
        data: parsed.data,
      } as unknown as WebhookEvent;
    default:
      throw new WebhookVerificationError(`Unknown event type: ${parsed.type}`);
  }
}

export function toWebRequest(
  req: import("node:http").IncomingMessage,
  rawBody: Buffer | string
): Request {
  const url = new URL(
    req.url || "/",
    `http://${req.headers.host || "localhost"}`
  );
  const body =
    typeof rawBody === "string" ? rawBody : rawBody.toString("utf-8");
  return new Request(url, {
    method: req.method || "POST",
    headers: new Headers(req.headers as Record<string, string>),
    body,
  });
}
