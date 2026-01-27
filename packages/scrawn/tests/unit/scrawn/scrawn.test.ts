import { afterEach, describe, expect, it, vi } from "vitest";
import { Scrawn } from "../../../src/core/scrawn.js";
import { createMockTransport } from "../../mocks/mockTransport.js";
import { EventService } from "../../../src/gen/event/v1/event_connect.js";
import { PaymentService } from "../../../src/gen/payment/v1/payment_connect.js";
import {
  RegisterEventResponse,
  SDKCall,
  SDKCallType,
} from "../../../src/gen/event/v1/event_pb.js";
import { CreateCheckoutLinkResponse } from "../../../src/gen/payment/v1/payment_pb.js";
import {
  ScrawnConfigError,
  ScrawnValidationError,
} from "../../../src/core/errors/index.js";

const validKey = "scrn_1234567890abcdef1234567890abcdef";

const transport = createMockTransport({
  unary: ({ service, method, input, headers }) => {
    if (
      service.typeName === EventService.typeName &&
      method.name === "RegisterEvent"
    ) {
      expect(headers).toEqual({ Authorization: `Bearer ${validKey}` });
      expect(input).toMatchObject({
        type: 1,
        userId: "user_1",
        data: {
          case: "sdkCall",
        },
      });

      const payload = input as {
        data: { value: SDKCall };
      };
      expect(payload.data.value.sdkCallType).toBe(SDKCallType.RAW);
      return new RegisterEventResponse({ random: "ok" });
    }

    if (
      service.typeName === PaymentService.typeName &&
      method.name === "CreateCheckoutLink"
    ) {
      expect(headers).toEqual({ Authorization: `Bearer ${validKey}` });
      expect(input).toEqual({ userId: "user_1" });
      return new CreateCheckoutLinkResponse({
        checkoutLink: "https://checkout.example",
      });
    }

    throw new Error("Unexpected call");
  },
});

vi.mock("@connectrpc/connect-node", () => ({
  createConnectTransport: () => transport,
}));

describe("Scrawn", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("tracks SDK call events", async () => {
    const scrawn = new Scrawn({
      apiKey: validKey,
      baseURL: "https://api.example",
    });
    await scrawn.sdkCallEventConsumer({ userId: "user_1", debitAmount: 5 });
  });

  it("rejects invalid event payloads", async () => {
    const scrawn = new Scrawn({
      apiKey: validKey,
      baseURL: "https://api.example",
    });

    await expect(
      scrawn.sdkCallEventConsumer({ userId: "", debitAmount: 5 })
    ).rejects.toBeInstanceOf(ScrawnValidationError);
  });

  it("collects payment links", async () => {
    const scrawn = new Scrawn({
      apiKey: validKey,
      baseURL: "https://api.example",
    });
    const link = await scrawn.collectPayment("user_1");

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

    await expect(scrawn.collectPayment("")).rejects.toBeInstanceOf(
      ScrawnValidationError
    );
  });
});
