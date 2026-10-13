import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Other build folders (NEXT_DIST_DIR=.next-test, .next-build …) and local
    // screenshots: generated files, not source.
    ".next-*/**",
    ".shots/**",
  ]),
  {
    rules: {
      // Straight quotes/apostrophes in JSX text render correctly; escaping
      // them across ~100 marketing-copy strings only hurts readability.
      "react/no-unescaped-entities": "off",
    },
  },
]);

export default eslintConfig;
