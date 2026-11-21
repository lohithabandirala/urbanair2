import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // esbuild's automatic JSX runtime lets us test .tsx without pulling in a
  // React fast-refresh plugin (which is not needed for tests).
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: [
        "src/domain/**/*.ts",
        "src/lib/**/*.ts",
        "src/services/**/*.ts",
      ],
      exclude: ["**/*.test.ts", "**/*.test.tsx", "src/lib/i18n/**"],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
});
