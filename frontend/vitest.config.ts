import { defineConfig } from "vitest/config";

// Rules tests run inside `firebase emulators:exec` (see the test:rules
// script), which sets FIRESTORE_EMULATOR_HOST for @firebase/rules-unit-testing.
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    testTimeout: 15000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
