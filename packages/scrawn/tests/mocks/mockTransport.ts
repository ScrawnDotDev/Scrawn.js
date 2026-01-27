import type { MethodInfo, ServiceType } from "@bufbuild/protobuf";
import type { Transport, UnaryResponse } from "@connectrpc/connect";
import { Headers } from "undici";

type HeaderInit = Record<string, string> | string[][] | Headers | undefined;

export type UnaryHandler = (request: {
  service: ServiceType;
  method: MethodInfo;
  input: unknown;
  headers: HeaderInit;
}) => Promise<unknown> | unknown;

export function createMockTransport(handlers: {
  unary: UnaryHandler;
}): Transport {
  return {
    async unary(
      service,
      method,
      _signal,
      _timeoutMs,
      header,
      input
    ): Promise<UnaryResponse> {
      const message = await handlers.unary({
        service,
        method,
        input,
        headers: header as HeaderInit,
      });

      return {
        stream: false,
        service,
        method,
        header: new Headers(header as HeaderInit),
        trailer: new Headers(),
        message,
      } as UnaryResponse;
    },
    async stream(): Promise<never> {
      throw new Error("Streaming not supported in mock transport");
    },
  };
}
