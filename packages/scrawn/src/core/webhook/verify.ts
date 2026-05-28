import { createVerify } from "node:crypto";

export class WebhookVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebhookVerificationError";
  }
}

export interface WebhookHeaders {
  webhookId: string;
  webhookTimestamp: string;
  webhookSignature: string;
}

export function extractWebhookHeaders(
  headers: Headers | Record<string, string | string[] | undefined>
): WebhookHeaders {
  const get = (key: string): string | undefined => {
    if (headers instanceof Headers) {
      const val = headers.get(key);
      return val ?? undefined;
    }
    const val = (headers as Record<string, string | string[] | undefined>)[key];
    if (Array.isArray(val)) return val[0];
    return val;
  };

  const webhookId = get("webhook-id");
  const webhookTimestamp = get("webhook-timestamp");
  const webhookSignature = get("webhook-signature");

  if (!webhookId) {
    throw new WebhookVerificationError("Missing webhook-id header");
  }
  if (!webhookTimestamp) {
    throw new WebhookVerificationError("Missing webhook-timestamp header");
  }
  if (!webhookSignature) {
    throw new WebhookVerificationError("Missing webhook-signature header");
  }

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

export interface VerificationResult {
  id: string;
  timestamp: string;
  rawBody: string;
}

export function verifyWebhookSignature(
  rawBody: string,
  headers: WebhookHeaders,
  publicKeyPrefixed: string,
  toleranceSeconds: number = 300
): VerificationResult {
  const { webhookId, webhookTimestamp, webhookSignature } = headers;

  if (webhookSignature.startsWith("v1a,")) {
    const signature = webhookSignature.slice("v1a,".length);
    const signedPayload = `${webhookId}.${webhookTimestamp}.${rawBody}`;
    const publicKeyPem = publicKeyPrefixedToPem(publicKeyPrefixed);

    const isValid = verifyEd25519(signedPayload, signature, publicKeyPem);

    if (!isValid) {
      throw new WebhookVerificationError("Invalid webhook signature");
    }
  } else {
    throw new WebhookVerificationError(
      `Unsupported signature version: expected v1a, got ${
        webhookSignature.split(",")[0]
      }`
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const timestamp = parseInt(webhookTimestamp, 10);

  if (Number.isNaN(timestamp)) {
    throw new WebhookVerificationError(
      "Invalid webhook-timestamp: not a number"
    );
  }

  if (Math.abs(now - timestamp) > toleranceSeconds) {
    throw new WebhookVerificationError(
      `Webhook timestamp is outside tolerance (${Math.abs(
        now - timestamp
      )}s > ${toleranceSeconds}s)`
    );
  }

  return {
    id: webhookId,
    timestamp: new Date(timestamp * 1000).toISOString(),
    rawBody,
  };
}
