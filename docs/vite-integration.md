# Vite Integration Guide for Workspace Packages

This guide explains how to effectively integrate your shared packages (`@divalsehgal/design-tokens` and `@divalsehgal/fonts`) into a Vite project. It also addresses your questions about package managers and UI injection methods.

---

## 1. Package Manager Choice: npm vs. Others

In a monorepo where you plan to share and deploy packages, **pnpm** is generally superior to `npm` or `yarn` for several reasons:

| Feature | npm | Yarn (v1) | pnpm |
| :--- | :--- | :--- | :--- |
| **Speed** | Slowest | Fast | **Fastest** |
| **Storage** | Duplicates deps | Duplicates deps | **Content-addressable (saves GBs)** |
| **Monorepo** | Basic | Good | **Excellent (Workspace protocol)** |
| **Strictness** | Lax | Lax | **Prevents "phantom" dependencies** |

> [!TIP]
> If you are starting fresh or want better monorepo support, **pnpm** is the recommended choice. If you prefer to stay with what you have, **Yarn v4** is also a great modern option for monorepos.

---

## 2. Alternatives to MUI for Vite

While MUI is powerful, it can be heavy for a lightweight Vite project. Here are faster, better-integrated alternatives for your design tokens:

### **A. CSS Variables (The "Native" Way)**
Your `design-tokens` package already generates CSS variables.
1. Install: `yarn add @divalsehgal/design-tokens` (locally)
2. Import:
   ```javascript
   // main.js or main.ts
   import "@divalsehgal/design-tokens/variables.css";
   ```
3. Use: `background-color: var(--color-primary-500);`

### **B. SCSS Modules (The Standard Way)**
Vite has built-in support for SCSS and CSS Modules. This is the most straightforward way to use your tokens:
1. Install Sass: `yarn add -D sass`
2. Import variables in your `*.module.scss` files:
   ```scss
   @use "@divalsehgal/design-tokens/variables.scss" as tokens;

   .button {
     background-color: tokens.$color-primary-500;
   }
   ```
3. Use in your components: `import styles from "./Button.module.scss";`

### **C. Panda CSS (The Modern Design System Way)**
If you want type-safety and a developer experience similar to Tailwind but without the "utility-first" constraints, Panda CSS is perfect:
- **Build-time**: Zero runtime overhead.
- **Type-safe**: It generates TypeScript types from your design tokens.
- **Tokens-first**: It's designed specifically for building design systems.

---

## 3. Integrating Fonts in Vite

We've#### [index.css](file:///Users/divalsehgal/Documents/nextjs-template/packages/fonts/index.css)
If you are using the CSS import in Vite, you can override the font URLs dynamically using CSS variables:
```css
:root {
  --font-url-regular: url('https://your-cdn.com/fonts/StackSans-Regular.ttf');
}
```

#### [Configurable Loader](file:///Users/divalsehgal/Documents/nextjs-template/packages/fonts/next/index.js)
If you are using Next.js, you can now pass a custom `assetsPath`:
```javascript
import { createStackSans } from "@divalsehgal/fonts/next";

const myFont = createStackSans({ assetsPath: "https://my-cdn.com/" });
```

---

## **Layered Design Tokens**
Your design tokens support tiered sourcing:
1.  **Package Defaults**: Located at `packages/design-tokens/tokens/`.
2.  **Parent Overrides**: Located at the monorepo root `tokens/`.

Anything defined in the root `tokens/` directory will automatically **override** the package defaults when you run a build. This allows you to customize the theme without modifying the base package code.
`Inter`) are now available globally via the CSS classes defined in the package.

---

## 4. How to use in Vite (Step-by-Step)

1.  **Link the packages**: Use `workspace:*` (if in the same monorepo) or install them after publishing.
2.  **Configuration**: In your `vite.config.ts`, you might need to ensure your shared packages are transpiled:
    ```typescript
    export default defineConfig({
      optimizeDeps: {
        include: ["@divalsehgal/design-tokens", "@divalsehgal/fonts"]
      }
    });
    ```
3.  **Entry Point**: Import the styles in your main entry point.

---
*By moving away from MUI-specific injection, your Vite apps will be faster and have smaller bundle sizes.*
