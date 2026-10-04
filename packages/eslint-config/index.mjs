/** Code-line budget per file (TS/TSX here; SCSS via stylelint-plugins/max-lines). */
export const MAX_FILE_LINES = 220;

// Tree-shaking and package boundaries: icons only via the per-icon module,
// workspace packages only through their public subpaths.
const RESTRICTED_PATHS = [
  {
    name: "@phosphor-icons/react",
    message: "Import icons from @dival-sehgal/ui/icons (per-icon imports keep the bundle small).",
    allowTypeImports: true,
  },
  {
    name: "@phosphor-icons/react/ssr",
    message: "Import icons from @dival-sehgal/ui/icons (per-icon imports keep the bundle small).",
    allowTypeImports: true,
  },
];

const RESTRICTED_PATTERNS = [
  { group: ["@mui/*", "@emotion/*"], message: "MUI was removed. Use @dival-sehgal/ui instead." },
  {
    group: ["@/components/ui/*", "@/utils/string", "@/utils/math", "@/utils/fuzzy", "@/utils/dom", "@/utils/fetchWithRetry"],
    message: "These moved to workspace packages: import from @dival-sehgal/ui/* or @dival-sehgal/utils/*.",
  },
  {
    group: ["@dival-sehgal/*/src/*", "**/packages/*/src/*"],
    message: "Import workspace packages by their public subpath (e.g. @dival-sehgal/ui/button), not their source files.",
  },
  {
    // Every component owns its styles: only ./styles.module.scss next to it.
    regex: String.raw`^(?!\./styles\.module\.scss$).*\.module\.scss$`,
    message: "Import only your own ./styles.module.scss. Give a sub-component its own folder and stylesheet instead of sharing another component's.",
  },
];

/** Build output and generated files never get linted. */
export const ignoresConfig = [
  {
      ignores: [
        ".next/**",
        "out/**",
        "build/**",
        "dist/**",
        "node_modules/**",
        "coverage/**",
        "next-env.d.ts"
      ]
    }
];

/** Shared code-quality rules for every TypeScript workspace. */
export const baseConfig = [
  {
      rules: {
        // General Quality & Code Smells
        "no-console": ["error", { "allow": ["warn", "error", "info"] }],
        "prefer-const": "error",
        "no-duplicate-imports": "error",
        "no-nested-ternary": "error",
        "curly": ["error", "all"],
        "eqeqeq": ["error", "always"],
        "no-empty-function": "error",
        
        // Complexity & Size
        "complexity": ["error", 15],
        // 220 code lines (blank lines and comments don't count): enough for one
        // cohesive component or module; past that it's doing two jobs — split it.
        // Stylesheets get the same limit via the local stylelint max-lines rule.
        "max-lines": ["error", { "max": MAX_FILE_LINES, "skipBlankLines": true, "skipComments": true }],
        "max-depth": ["error", 4],
        "max-params": ["error", 4],
  
        // TypeScript & Naming Conventions
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
        "@typescript-eslint/naming-convention": [
          "error",
          {
            "selector": "variable",
            "format": ["camelCase", "UPPER_CASE", "PascalCase"],
            "leadingUnderscore": "allow"
          },
          {
            "selector": "function",
            "format": ["camelCase", "PascalCase"]
          },
          {
            "selector": "typeLike",
            "format": ["PascalCase"]
          },
          {
            "selector": "interface",
            "format": ["PascalCase"],
            "custom": {
              "regex": "^I[A-Z]",
              "match": false
            }
          }
        ],
  
        "no-restricted-imports": ["error", { paths: RESTRICTED_PATHS, patterns: RESTRICTED_PATTERNS }],
  
        // No magic numbers: give every meaningful number a named constant.
        // 0, 1, 2 and -1 are allowed (counts, halves, "not found"); 100 is
        // allowed for percentages. Object-literal values (config objects,
        // style props) are exempt — the key already names them.
        "no-magic-numbers": "off",
        "@typescript-eslint/no-magic-numbers": ["error", {
          "ignore": [-1, 0, 1, 2, 100],
          "ignoreArrayIndexes": true,
          "ignoreDefaultValues": true,
          "ignoreEnums": true,
          "ignoreNumericLiteralTypes": true,
          "ignoreReadonlyClassProperties": true,
          "ignoreTypeIndexes": true,
          "ignoreClassFieldInitialValues": true,
          "enforceConst": true,
          "detectObjects": false
        }],
  
        // No random values: Math.random in render breaks hydration and isn't
        // safe for ids. Use useId(), crypto.randomUUID() or a seeded generator.
        "no-restricted-properties": ["error", {
          "object": "Math",
          "property": "random",
          "message": "Use useId(), crypto.randomUUID() or a seeded generator instead of Math.random()."
        }],
  
        // Secrets must never be exposed to the browser.
        "no-restricted-syntax": ["error", {
          "selector": "MemberExpression[object.object.name='process'][object.property.name='env'][property.name=/^NEXT_PUBLIC_.*(SECRET|TOKEN|PASSWORD|PRIVATE|API_KEY)/]",
          "message": "NEXT_PUBLIC_ variables are bundled into client code. Keep secrets server-only (no NEXT_PUBLIC_ prefix)."
        }]
      }
    }
];

/** Portfolio only: user-facing text must go through t() so it can be translated. */
export const i18nConfig = [
  {
      // User-facing text must go through t() (src/i18n) so it can be translated.
      // Decorative glyphs and punctuation are allowed.
      files: ["**/*.tsx"],
      rules: {
        "react/jsx-no-literals": ["error", {
          "noStrings": false,
          "ignoreProps": true,
          "allowedStrings": ["→", "←", "·", "×", "✕", "✦", "▼", "↺", "📖", "📋", "🔍", "/", "%", "`", "⌘K", "esc", "↑", "↓", "↵", "—", "-", "|", "…", "(", ")", ",", ":", "#", "+", "@", "$"]
        }]
      }
    }
];

/** Every component owns its stylesheet (SCSS-module apps). */
export const styleOwnershipConfig = [
  {
      // A stylesheet belongs to one component: only a component's entry file
      // (or a route file) may import it. Sub-components live in their own folder.
      files: ["**/*.tsx"],
      ignores: ["**/index.tsx", "**/page.tsx", "**/layout.tsx", "**/not-found.tsx", "**/error.tsx", "**/*.test.tsx", "**/test.tsx"],
      rules: {
        "no-restricted-imports": ["error", {
          paths: RESTRICTED_PATHS,
          patterns: [
            ...RESTRICTED_PATTERNS,
            {
              regex: String.raw`\.module\.scss$`,
              message: "Only a component's index.tsx may import its styles. Move this sub-component into its own folder with its own styles.module.scss.",
            },
          ],
        }],
      },
    }
];

/** Tests, scripts, configs and end-to-end specs use literal data freely. */
export const testOverridesConfig = [
  {
      // Tests, scripts, configs and end-to-end specs use literal data freely.
      files: ["**/*.test.*", "**/test.*", "**/__tests__/**", "**/e2e/**", "**/scripts/**", "**/*.config.*", "**/test-utils/**", "**/test-mocks/**"],
      rules: {
        "@typescript-eslint/no-magic-numbers": "off",
        "react/jsx-no-literals": "off"
      }
    }
];

/** Next.js portfolio: everything. Combine with eslint-config-next presets in the app. */
export const nextEslintConfig = [
  ...ignoresConfig,
  ...baseConfig,
  ...i18nConfig,
  ...styleOwnershipConfig,
  ...testOverridesConfig,
];
