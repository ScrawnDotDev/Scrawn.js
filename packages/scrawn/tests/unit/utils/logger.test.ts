import { describe, expect, it, vi } from "vitest";

describe("ScrawnLogger", () => {
  it("logs to console with context", async () => {
    const consoleSpy = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);
    const { ScrawnLogger } = await import("../../../src/utils/logger.js");

    const logger = new ScrawnLogger("Test");
    logger.info("Hello");

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("[Test]"));
    consoleSpy.mockRestore();
  });

  it("skips debug logs when disabled", async () => {
    const consoleSpy = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);
    delete process.env.SCRAWN_DEBUG;

    const { ScrawnLogger } = await import("../../../src/utils/logger.js");
    const logger = new ScrawnLogger("Debug");
    logger.debug("Debug");

    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
