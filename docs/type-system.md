# TypeScript Type System

> **One file to rule them all**: all shared types live in `src/types/`.

---

## Directory Layout

```
src/types/
├── index.ts      ← barrel re-export (import from here)
├── blog.ts       ← Notion blog post shapes
├── contact.ts    ← Contact form, submissions, toast
├── github.ts     ← GitHub API response shapes
└── ui.ts         ← Shared UI / component types
```

---

## How to Import

Always import from the barrel:

```ts
// ✅ Correct — one consistent import path
import type { NotionBlogPost, BreadcrumbItem } from "@/types";

// ❌ Avoid — brittle, leaks internal structure
import type { NotionBlogPost } from "@/types/blog";
```

---

## `interface` vs `type` — When to Use Which

| Use `interface` | Use `type` |
|---|---|
| Object shapes that describe a *contract* (e.g. props, context) | Union / intersection types (`"success" \| "error"`) |
| When you expect the shape to be extended or implemented | Zod-inferred types (`z.infer<typeof Schema>`) |
| Public API contracts | Tuple types, mapped types, conditional types |

```ts
// interface — public contract, could be implemented by a class
export interface ToastContextType {
    showToast: (message: string, severity?: ToastSeverity) => void;
}

// type — union literal
export type ToastSeverity = "success" | "info" | "warning" | "error";

// type — inferred from Zod (never write interfaces for these)
export type PortfolioConfig = z.infer<typeof PortfolioConfigSchema>;
```

In practice: **be consistent within a file**. Both `interface` and `type` compile identically for object shapes — pick one and stick with it.

---

## Global vs Imported Types

### Prefer imports (what we do here)

```ts
import type { BreadcrumbItem } from "@/types";
```

Importing types is the **industry standard** for application code. It is:
- Explicit — you know exactly where a type comes from
- Tree-shakeable — unused types don't pollute the type namespace
- IDE-friendly — "Go to Definition" works perfectly

### When to use global declarations

Use `declare global` / ambient `.d.ts` files **only** for:

1. **Augmenting third-party types** — e.g. adding a property to the `Window` object:
   ```ts
   // src/types/globals.d.ts
   declare global {
     interface Window {
       gtag: Gtag.Gtag;
     }
   }
   ```

2. **Process environment variables** — letting TypeScript know about `process.env.MY_VAR`:
   ```ts
   // src/types/env.d.ts
   declare namespace NodeJS {
     interface ProcessEnv {
       NOTION_API_KEY: string;
     }
   }
   ```

3. **Module augmentation** — adding fields to library types.

> **Never** declare global types as a shortcut to avoid writing imports. It makes code harder to trace and breaks code-splitting.

---

## Co-location Rule

Not everything belongs in `src/types/`. Follow this rule:

| Type | Where it lives | Reason |
|---|---|---|
| `PortfolioConfig`, `ExperienceConfig` | `src/features/portfolio/schema.ts` | Inferred from Zod schema — must stay with schema |
| `ContactFormState`, `NotionBlogPost`, `BreadcrumbItem` | `src/types/` | Used across multiple unrelated modules |
| `BreadcrumbsProps`, `ToasterProps` | Inside their component file | Private to the component — not exported |
| `GitHubFileResponse` | `src/types/github.ts` | Service layer type shared between network code and consumers |

**Rule of thumb**: if a type is used in **more than one module**, move it to `src/types/`. If it is only used in one file, keep it co-located.

---

## Adding a New Type

1. Identify which domain file it belongs to (`blog.ts`, `contact.ts`, etc.)
2. If none fit, create a new domain file: `src/types/payments.ts`
3. Add a re-export to `src/types/index.ts`
4. Import via `@/types` everywhere

```ts
// 1. Define in domain file
// src/types/payments.ts
export type PaymentStatus = "pending" | "paid" | "failed";

// 2. Re-export in barrel
// src/types/index.ts
export type { PaymentStatus } from "./payments";

// 3. Use anywhere
import type { PaymentStatus } from "@/types";
```
