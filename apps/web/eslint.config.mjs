import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { nextEslintConfig } from "@dival-sehgal/eslint-config";

const R3F_PROPS = ["args", "position", "scale", "intensity", "roughness", "metalness", "transparent", "opacity", "attach", "dispose", "object"];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...nextEslintConfig,
  {
    // react-three-fiber intrinsic elements (<mesh>, <boxGeometry>, lights, …)
    // take three.js props, not DOM attributes: keep the unknown-DOM-prop check
    // but teach it the R3F props this app uses.
    files: ["**/*.tsx"],
    rules: {
      "react/no-unknown-property": ["error", { ignore: R3F_PROPS }],
    },
  },
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
