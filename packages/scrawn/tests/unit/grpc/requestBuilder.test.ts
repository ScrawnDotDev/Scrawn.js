import { describe, expect, it, vi } from "vitest";
import type * as grpc from "@grpc/grpc-js";
import { RequestBuilder } from "../../../src/core/grpc/requestBuilder.js";
import { GrpcCallContext } from "../../../src/core/grpc/callContext.js";

class FakePaymentResponse {
  constructor(private readonly checkoutLink: string) {}

  getCheckoutlink(): string {
    return this.checkoutLink;
  }
}

class FakePaymentClient {
  static serviceName = "payment.v1.PaymentService";
  static lastCall: { request: unknown; auth?: string } | null = null;

  constructor(
    _address: string,
    _credentials: grpc.ChannelCredentials,
    _options?: grpc.ClientOptions
  ) {}

  createCheckoutLink(
    request: unknown,
    metadata: grpc.Metadata,
    _options: grpc.CallOptions,
    callback: (error: grpc.ServiceError | null, response: FakePaymentResponse) => void
  ): void {
    FakePaymentClient.lastCall = {
      request,
      auth: metadata.get("authorization")[0] as string | undefined,
    };
    callback(null, new FakePaymentResponse("https://checkout.example"));
  }
}

describe("RequestBuilder", () => {
  it("builds a request with metadata and payload", async () => {
    FakePaymentClient.lastCall = null;
    const ctx = new GrpcCallContext(
      "api.example:8069",
      { compose: vi.fn() } as unknown as grpc.ChannelCredentials,
      FakePaymentClient as unknown as grpc.ServiceClientConstructor,
      "createCheckoutLink",
      "RequestBuilder"
    );

    const response = await new RequestBuilder(ctx)
      .addMetadata("authorization", "Bearer token")
      .addPayload({ userId: "user_1" })
      .request<FakePaymentResponse>();

    expect(FakePaymentClient.lastCall).toEqual({
      request: { userId: "user_1" },
      auth: "Bearer token",
    });
    expect(response.getCheckoutlink()).toBe("https://checkout.example");
  });

  it("throws when payload is missing", async () => {
    const ctx = new GrpcCallContext(
      "api.example:8069",
      { compose: vi.fn() } as unknown as grpc.ChannelCredentials,
      FakePaymentClient as unknown as grpc.ServiceClientConstructor,
      "createCheckoutLink",
      "RequestBuilder"
    );

    await expect(new RequestBuilder(ctx).request()).rejects.toThrow("addPayload");
  });

  it("prevents payload from being set twice", () => {
    const ctx = new GrpcCallContext(
      "api.example:8069",
      { compose: vi.fn() } as unknown as grpc.ChannelCredentials,
      FakePaymentClient as unknown as grpc.ServiceClientConstructor,
      "createCheckoutLink",
      "RequestBuilder"
    );

    const builder = new RequestBuilder(ctx);
    builder.addPayload({ userId: "user_1" });

    expect(() => builder.addPayload({ userId: "user_2" })).toThrow(
      "Payload has already been set"
    );
  });
});
