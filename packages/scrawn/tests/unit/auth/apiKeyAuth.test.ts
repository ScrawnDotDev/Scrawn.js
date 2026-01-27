import { describe, expect, it } from "vitest";
import {
  ApiKeyAuth,
  isValidApiKey,
  validateApiKey,
} from "../../../src/core/auth/apiKeyAuth.js";
import { ScrawnValidationError } from "../../../src/core/errors/index.js";

const validKey = "scrn_1234567890abcdef1234567890abcdef";

describe("apiKeyAuth", () => {
  it("validates api key format", () => {
    expect(isValidApiKey(validKey)).toBe(true);
    expect(isValidApiKey("scrn_invalid")).toBe(false);
  });

  it("throws a validation error for invalid api keys", () => {
    expect(() => validateApiKey("scrn_invalid")).toThrow(ScrawnValidationError);
  });

  it("returns validated credentials", async () => {
    const auth = new ApiKeyAuth(validKey);
    await expect(auth.getCreds()).resolves.toEqual({ apiKey: validKey });
  });
});
