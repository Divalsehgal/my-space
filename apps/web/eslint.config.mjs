import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { nextEslintConfig } from "@dival-sehgal/eslint-config";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...nextEslintConfig,
  {
    settings: {
      next: {
        rootDir: "apps/web/",
      },
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "public/**",
    ".wrangler/**",
    ".next/**",
    "dist/**",
    "node_modules/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
