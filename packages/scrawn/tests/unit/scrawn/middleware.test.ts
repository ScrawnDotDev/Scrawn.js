import { afterEach, describe, expect, it, vi } from "vitest";
import { Scrawn } from "../../../src/core/scrawn.js";
import { RegisterEventResponse } from "../../../src/gen/event/v1/event_pb.js";

const validKey = "scrn_1234567890abcdef1234567890abcdef";

const requestMock = vi.fn(async () => {
  const response = new RegisterEventResponse();
  response.setRandom("ok");
  return response;
});

const addPayloadMock = vi.fn(function (this: unknown, _payload: unknown) {
  return this;
});

const addMetadataMock = vi.fn(function (this: unknown, _key: string, _value: string) {
  return this;
});

function attachMockClient(scrawn: Scrawn): void {
  (scrawn as unknown as { grpcClient: unknown }).grpcClient = {
    newCall: () => ({
      addMetadata: addMetadataMock,
      addPayload: addPayloadMock,
      request: requestMock,
    }),
  };
}

describe("middlewareEventConsumer", () => {
  afterEach(() => {
    addMetadataMock.mockClear();
    addPayloadMock.mockClear();
    requestMock.mockClear();
  });

  it("tracks events for matching paths", async () => {
    const scrawn = new Scrawn({
      apiKey: validKey,
      baseURL: "https://api.example",
    });
    attachMockClient(scrawn);
    const middleware = scrawn.middlewareEventConsumer({
      extractor: () => ({ userId: "user_1", debitAmount: 2 }),
      whitelist: ["/api/**"],
    });

    const next = vi.fn();
    await middleware({ path: "/api/users" }, {}, next);

    expect(next).toHaveBeenCalled();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(requestMock).toHaveBeenCalledTimes(1);
  });

  it("skips events for non-whitelisted paths", async () => {
    const scrawn = new Scrawn({
      apiKey: validKey,
      baseURL: "https://api.example",
    });
    attachMockClient(scrawn);
    const middleware = scrawn.middlewareEventConsumer({
      extractor: () => ({ userId: "user_1", debitAmount: 2 }),
      whitelist: ["/billing/**"],
    });

    const next = vi.fn();
    await middleware({ path: "/api/users" }, {}, next);

    expect(next).toHaveBeenCalled();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(requestMock).toHaveBeenCalledTimes(0);
  });

  it("skips events when extractor returns null", async () => {
    const scrawn = new Scrawn({
      apiKey: validKey,
      baseURL: "https://api.example",
    });
    attachMockClient(scrawn);
    const middleware = scrawn.middlewareEventConsumer({
      extractor: () => null,
    });

    const next = vi.fn();
    await middleware({ path: "/api/users" }, {}, next);

    expect(next).toHaveBeenCalled();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(requestMock).toHaveBeenCalledTimes(0);
  });
});
