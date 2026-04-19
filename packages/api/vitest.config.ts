import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    env: {
      DB_IN_MEMORY: "1",
    },
  },
});
