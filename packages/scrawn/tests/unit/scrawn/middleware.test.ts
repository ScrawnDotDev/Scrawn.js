import { afterEach, describe, expect, it, vi } from "vitest";
import { Scrawn } from "../../../src/core/scrawn.js";
import { createMockTransport } from "../../mocks/mockTransport.js";
import { EventService } from "../../../src/gen/event/v1/event_connect.js";
import { RegisterEventResponse } from "../../../src/gen/event/v1/event_pb.js";

const validKey = "scrn_1234567890abcdef1234567890abcdef";

const unaryHandler = vi.fn(({ service, input }) => {
  if (service.typeName === EventService.typeName) {
    const payload = input as { userId: string };
    expect(payload.userId).toBe("user_1");
    return new RegisterEventResponse({ random: "ok" });
  }

  throw new Error("Unexpected call");
});

const transport = createMockTransport({
  unary: unaryHandler,
});

vi.mock("@connectrpc/connect-node", () => ({
  createConnectTransport: () => transport,
}));

describe("middlewareEventConsumer", () => {
  afterEach(() => {
    unaryHandler.mockClear();
  });

  it("tracks events for matching paths", async () => {
    const scrawn = new Scrawn({
      apiKey: validKey,
      baseURL: "https://api.example",
    });
    const middleware = scrawn.middlewareEventConsumer({
      extractor: () => ({ userId: "user_1", debitAmount: 2 }),
      whitelist: ["/api/**"],
    });

    const next = vi.fn();
    await middleware({ path: "/api/users" }, {}, next);

    expect(next).toHaveBeenCalled();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(unaryHandler).toHaveBeenCalledTimes(1);
  });

  it("skips events for non-whitelisted paths", async () => {
    const scrawn = new Scrawn({
      apiKey: validKey,
      baseURL: "https://api.example",
    });
    const middleware = scrawn.middlewareEventConsumer({
      extractor: () => ({ userId: "user_1", debitAmount: 2 }),
      whitelist: ["/billing/**"],
    });

    const next = vi.fn();
    await middleware({ path: "/api/users" }, {}, next);

    expect(next).toHaveBeenCalled();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(unaryHandler).toHaveBeenCalledTimes(0);
  });

  it("skips events when extractor returns null", async () => {
    const scrawn = new Scrawn({
      apiKey: validKey,
      baseURL: "https://api.example",
    });
    const middleware = scrawn.middlewareEventConsumer({
      extractor: () => null,
    });

    const next = vi.fn();
    await middleware({ path: "/api/users" }, {}, next);

    expect(next).toHaveBeenCalled();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(unaryHandler).toHaveBeenCalledTimes(0);
  });
});
