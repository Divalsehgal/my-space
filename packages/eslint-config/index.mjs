export const nextEslintConfig = [
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
  },
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
      "max-lines": ["error", { 
        "max": 200, 
        "skipBlankLines": true, 
        "skipComments": true 
      }],
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
      ]
    }
  }
];
