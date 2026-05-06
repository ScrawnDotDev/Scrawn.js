import { describe, expect, it } from "vitest";
import type * as grpc from "@grpc/grpc-js";
import { GrpcClient } from "../../../src/core/grpc/client.js";

class FakeEventClient {
  static serviceName = "event.v1.EventService";

  constructor(
    _address: string,
    _credentials: grpc.ChannelCredentials,
    _options?: grpc.ClientOptions
  ) {}

  registerEvent(): void {}
}

describe("GrpcClient", () => {
  it("creates request builders with the configured target", () => {
    const client = new GrpcClient("api.example:8069");

    expect(client.getTarget()).toBe("api.example:8069");
    expect(() =>
      client.newCall(
        FakeEventClient as unknown as grpc.ServiceClientConstructor,
        "registerEvent"
      )
    ).not.toThrow();
  });
});
