import { afterEach, describe, expect, it, vi } from "vitest";
import { scrawn } from "../../../src/core/scrawn.js";
import type { Scrawn } from "../../../src/core/scrawn.js";
import { BasicUsageType } from "../../../src/gen/event/v1/event.js";
import {
  ScrawnConfigError,
  ScrawnValidationError,
} from "../../../src/core/errors/index.js";

const validKey = "scrn_live_1234567890abcdef1234567890abcdef";

const requestMock = vi.fn();
const addPayloadMock = vi.fn(function (this: unknown, payload: unknown) {
  requestMock(payload);
  return this;
});
const addMetadataMock = vi.fn(function (
  this: unknown,
  _key: string,
  _value: string
) {
  return this;
});
const unaryResponseMock = vi.fn();
let requestError: Error | null = null;

function attachMockClient(s: Scrawn): void {
  (s as unknown as { grpcClient: unknown }).grpcClient = {
    newCall: (_client: unknown, method: string) => ({
      addMetadata: addMetadataMock,
      addPayload: addPayloadMock,
      request: async () => {
        if (requestError) {
          const error = requestError;
          requestError = null;
          throw error;
        }
        if (method === "registerEvent") {
          const response = { random: "ok" };
          unaryResponseMock(response);
          return response;
        }

        const response = { checkoutLink: "https://checkout.example" };
        unaryResponseMock(response);
        return response;
      },
    }),
  };
}

describe("Scrawn", () => {
  afterEach(() => {
    vi.clearAllMocks();
    requestError = null;
  });

  it("tracks basic usage events", async () => {
    const biller = scrawn({
      apiKey: validKey,
      baseURL: "https://api.example",
    });
    attachMockClient(biller);

    await biller.basicUsageEventConsumer({ userId: "user_1", debitAmount: 5 });

    const request = requestMock.mock.calls[0][0] as any;
    expect(request.userId).toBe("user_1");
    expect(request.type).toBe(1);
    expect(request.eventId).toBeTruthy();
    expect(request.idempotencyKey).toBeTruthy();
    expect(request.basicUsage!.basicUsageType).toBe(BasicUsageType.RAW);
    expect(request.basicUsage!.amount).toBe(5);
  });

  it("rejects invalid event payloads", async () => {
    const biller = scrawn({
      apiKey: validKey,
      baseURL: "https://api.example",
    });
    attachMockClient(biller);

    const onError = vi.fn();

    await biller.basicUsageEventConsumer(
      { userId: "", debitAmount: 5 },
      { onError }
    );

    expect(onError).toHaveBeenCalledTimes(1);
    const error = onError.mock.calls[0][0];
    expect(error).toBeInstanceOf(ScrawnValidationError);
  });

  it("collects payment links", async () => {
    const biller = scrawn({
      apiKey: validKey,
      baseURL: "https://api.example",
    });
    attachMockClient(biller);
    const link = await biller.collectPayment("user_1");

    const request = requestMock.mock.calls[0][0] as any;
    expect(request.userId).toBe("user_1");
    expect(link).toBe("https://checkout.example");
  });

  it("validates constructor config", () => {
    expect(() => scrawn({ apiKey: "", baseURL: "" })).toThrow(
      ScrawnConfigError
    );
  });

  it("validates collectPayment input", async () => {
    const biller = scrawn({
      apiKey: validKey,
      baseURL: "https://api.example",
    });
    attachMockClient(biller);

    await expect(biller.collectPayment("")).rejects.toBeInstanceOf(
      ScrawnValidationError
    );
  });

  it("calls onError with retry context when basicUsageEventConsumer fails", async () => {
    const biller = scrawn({
      apiKey: validKey,
      baseURL: "https://api.example",
      retryCount: 0,
    });
    const onError = vi.fn();
    requestError = new Error("grpc down");
    attachMockClient(biller);

    await biller.basicUsageEventConsumer(
      { userId: "user_1", debitAmount: 5 },
      { onError }
    );

    expect(onError).toHaveBeenCalledTimes(1);
    const [error, context] = onError.mock.calls[0];
    expect(error).toHaveProperty("name");
    expect(context).toBeDefined();
    expect(typeof context!.retry).toBe("function");
  });
});
