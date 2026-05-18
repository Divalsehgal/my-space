Vite workspace integration means consuming shared packages through explicit build contracts instead of framework-specific injection assumptions.

## Manager (workspace)
Attack: Phantom dependency — a package works locally because another workspace installed a dependency it never declared.
Fix: Use a strict workspace package manager and declare package boundaries explicitly.

```bash
# ❌ dependency can be satisfied accidentally
npm install

# ✅ workspace resolution is strict
pnpm install
pnpm --filter web dev
```

| **Manager** | **Monorepo behavior** | **Risk** |
|---|---|---|
| npm | Basic workspaces | Loose dependency graph |
| Yarn v1 | Common workspace support | Hoisting hides gaps |
| pnpm | Strict workspace graph | Requires clean manifests |

**Phantom dependency** — code imports a package it does not list.

**Workspace protocol** — use it when packages live in the same repo.

**Strict install** — catches dependency ownership bugs early.

## Tokens (native)
Attack: Framework lock-in — design tokens are consumed only through MUI-specific theme injection.
Fix: Import generated CSS variables or SCSS variables directly in Vite apps.

```js
// ❌ token access tied to one UI library
import { theme } from "@mui/material";

// ✅ Vite entry imports runtime variables
import "@divalsehgal/design-tokens/light.css";
import "@divalsehgal/design-tokens/dark.css";
```

| **Surface** | **Use** |
|---|---|
| CSS variables | Runtime theming |
| SCSS variables | CSS modules |
| TS variables | Theme object construction |

**Native variables** — work without a component library.

**SCSS modules** — align well with Vite's CSS pipeline.

**MUI adapter** — should be optional, not the source of truth.

## Fonts (assets)
Attack: Broken font URLs — a package references local font files that do not exist in the consuming app's public path.
Fix: expose stable CSS imports or configurable asset paths.

```js
// ❌ consumer assumes package internals
const url = "/packages/fonts/assets/StackSans-Regular.ttf";

// ✅ package controls its public loader
import "@divalsehgal/fonts/index.css";
```

| **Method** | **Best for** |
|---|---|
| CSS import | Vite and browser-native loading |
| Configurable loader | Next.js font integration |
| CDN asset path | Published packages |

**Asset path** — package consumers should not depend on repo folders.

**CSS import** — simplest cross-framework font contract.

**CDN path** — useful after publishing packages.

## Optimization (bundling)
Attack: Untranspiled workspace package — Vite skips dependency processing and the app fails on package syntax or styles.
Fix: include shared packages in dependency optimization when the app needs it.

```js
// ❌ Vite has no package hint
export default defineConfig({});

// ✅ shared packages are optimized
export default defineConfig({
  optimizeDeps: {
    include: ["@divalsehgal/design-tokens", "@divalsehgal/fonts"],
  },
});
```

| **Config** | **Prevents** |
|---|---|
| `optimizeDeps.include` | Missed dependency prebundle |
| CSS entry import | Missing runtime variables |
| Package exports | Deep import coupling |

**Package exports** — expose public entry points deliberately.

**Prebundle hint** — add it when Vite misses workspace packages.

**Entry import** — put global token CSS in the app root.

## Critical Chain
Order matters because Vite apps consume packages through package boundaries, not Next.js-specific runtime assumptions.

    Shared token package only works through MUI
      -> Vite app imports framework-specific theme code
      -> fonts reference repo-local asset paths
      -> package fails after publishing
      -> consumer adds deep imports
      -> package API becomes impossible to stabilize
