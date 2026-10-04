# Workspace packages

```
apps/web                      the Next.js site (pages, containers, app-specific components and logic)
packages/
  ui            @dival-sehgal/ui            token-styled primitives: Button, IconButton, TextField, Spinner, Tooltip, Skeleton, icons
  utils         @dival-sehgal/utils         framework-free helpers: string, math, fuzzy, dom, fetch-with-retry
  design-tokens @dival-sehgal/design-tokens colours, spacing, type, motion → SCSS / CSS / TS
  fonts         @dival-sehgal/fonts         self-hosted fonts for next/font
  next-config, eslint-config, jest-config   shared tooling
```

Dependencies point one way: **app → ui → design-tokens**, **app → utils**. Packages never import from the app (`@/…` paths don't exist inside them).

## Why this keeps bundles small

- **One entry point per module.** Import `@dival-sehgal/ui/button`, not a barrel, so a page only pulls in what it uses.
- **`sideEffects`** is declared (`false` for utils, `["**/*.scss"]` for ui), so the bundler can drop unused modules.
- **Source packages.** They ship TypeScript and SCSS, and the app compiles them (`transpilePackages`). Server/client boundaries (`"use client"`) and CSS Modules work exactly as they do in app code.
- **Clear ownership.** Third-party dependencies live with the package that needs them (Phosphor and Radix Tooltip are in `ui`, not the app), so it's obvious what each feature costs.

Splitting into packages doesn't shrink anything by itself; the per-file exports and side-effect flags do. The packages make those rules enforceable, and Turbo caches each package's `test`, `lint` and `typecheck` separately.

## Where new code goes

| It is… | Put it in |
| --- | --- |
| A generic, styled building block with no site knowledge | `packages/ui` |
| A pure function with no React, Next or site knowledge | `packages/utils` |
| Anything that knows about the portfolio, blog, i18n, analytics or Contentful | `apps/web/src` (`features/`, `lib/`, `utils/`) |

## Adding a module

1. Add the file under `packages/<name>/src/`.
2. Add a subpath to that package's `exports` (e.g. `"./select": "./src/Select/index.tsx"`).
3. Import it as `@dival-sehgal/<name>/<subpath>`.

UI styles use the design tokens (`@use "variables.scss"`) and the package's own helpers (`@use "../styles/motion"`). The app's Sass load path includes both.

## Commands

From the repo root: `yarn test`, `yarn typecheck`, `yarn lint` (Turbo runs every workspace). For one package: `yarn workspace @dival-sehgal/ui test`.
