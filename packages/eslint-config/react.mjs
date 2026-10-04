import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import { baseConfig, ignoresConfig, testOverridesConfig } from "./index.mjs";

/**
 * Preset for React apps that aren't Next.js (e.g. the Vite-based Contentful
 * quiz app): TypeScript + hooks rules and the shared code-quality rules,
 * without the portfolio-only translation and stylesheet rules.
 */
export const reactConfig = [
  ...ignoresConfig,
  ...tseslint.configs.recommended,
  {
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  ...baseConfig,
  ...testOverridesConfig,
];

export default reactConfig;
