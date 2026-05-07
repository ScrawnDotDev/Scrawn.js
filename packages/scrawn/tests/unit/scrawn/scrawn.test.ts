import { afterEach, describe, expect, it, vi } from "vitest";
import { Scrawn } from "../../../src/core/scrawn.js";
import {
  RegisterEventRequest,
  RegisterEventResponse,
  SDKCallType,
} from "../../../src/gen/event/v1/event_pb.js";
import {
  CreateCheckoutLinkRequest,
  CreateCheckoutLinkResponse,
} from "../../../src/gen/payment/v1/payment_pb.js";
import {
  ScrawnConfigError,
  ScrawnValidationError,
} from "../../../src/core/errors/index.js";

const validKey = "scrn_1234567890abcdef1234567890abcdef";

const requestMock = vi.fn();
const addPayloadMock = vi.fn(function (this: unknown, payload: unknown) {
  requestMock(payload);
  return this;
});
const addMetadataMock = vi.fn(function (this: unknown, _key: string, _value: string) {
  return this;
});
const unaryResponseMock = vi.fn();

function attachMockClient(scrawn: Scrawn): void {
  (scrawn as unknown as { grpcClient: unknown }).grpcClient = {
    newCall: (_client: unknown, method: string) => ({
      addMetadata: addMetadataMock,
      addPayload: addPayloadMock,
      request: async () => {
        if (method === "registerEvent") {
          const response = new RegisterEventResponse();
          response.setRandom("ok");
          unaryResponseMock(response);
          return response;
        }

        const response = new CreateCheckoutLinkResponse();
        response.setCheckoutlink("https://checkout.example");
        unaryResponseMock(response);
        return response;
      },
    }),
  };
}

describe("Scrawn", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("tracks SDK call events", async () => {
    const scrawn = new Scrawn({
      apiKey: validKey,
      baseURL: "https://api.example",
    });
    attachMockClient(scrawn);

    await scrawn.sdkCallEventConsumer({ userId: "user_1", debitAmount: 5 });

    const request = requestMock.mock.calls[0][0] as RegisterEventRequest;
    expect(request.getUserid()).toBe("user_1");
    expect(request.getType()).toBe(1);
    expect(request.getSdkcall()?.getSdkcalltype()).toBe(SDKCallType.RAW);
    expect(request.getSdkcall()?.getAmount()).toBe(5);
  });

  it("rejects invalid event payloads", async () => {
    const scrawn = new Scrawn({
      apiKey: validKey,
      baseURL: "https://api.example",
    });
    attachMockClient(scrawn);

    await expect(
      scrawn.sdkCallEventConsumer({ userId: "", debitAmount: 5 })
    ).rejects.toBeInstanceOf(ScrawnValidationError);
  });

  it("collects payment links", async () => {
    const scrawn = new Scrawn({
      apiKey: validKey,
      baseURL: "https://api.example",
    });
    attachMockClient(scrawn);
    const link = await scrawn.collectPayment("user_1");

    const request = requestMock.mock.calls[0][0] as CreateCheckoutLinkRequest;
    expect(request.getUserid()).toBe("user_1");
    expect(link).toBe("https://checkout.example");
  });

  it("validates constructor config", () => {
    expect(() => new Scrawn({ apiKey: "", baseURL: "" })).toThrow(
      ScrawnConfigError
    );
  });

  it("validates collectPayment input", async () => {
    const scrawn = new Scrawn({
      apiKey: validKey,
      baseURL: "https://api.example",
    });
    attachMockClient(scrawn);

    await expect(scrawn.collectPayment("")).rejects.toBeInstanceOf(
      ScrawnValidationError
    );
  });
});
