import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // This rule flags the standard "set loading flag, fetch, set data"
      // effect pattern used throughout this app's data-fetching components
      // as an error; that pattern is intentional here, not a bug.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The Cloud Functions package has its own toolchain and tsconfig
    // (see functions/); this config is for the Next.js app only.
    "functions/**",
    // One-off maintenance scripts, run by hand — not app code.
    "scripts/**",
  ]),
]);

export default eslintConfig;
