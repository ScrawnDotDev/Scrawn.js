import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@bufbuild/protobuf/wire": path.resolve(__dirname, "../../node_modules/@bufbuild/protobuf/dist/esm/wire/index.js"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    exclude: ["node_modules", "dist", "src/gen"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "dist/", "src/gen/", "tests/**"],
    },
  },
});
