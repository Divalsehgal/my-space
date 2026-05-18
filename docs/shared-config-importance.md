Shared Next.js configuration means centralizing build behavior so every app in a monorepo ships with the same production contract.

## Duplication (drift)
Attack: Config copy-paste — each app carries its own `next.config.ts` until build behavior diverges silently.
Fix: Move shared defaults into a workspace package and keep app config thin.

```js
// ❌ every app repeats production defaults
module.exports = { output: "standalone", transpilePackages: ["@pkg/ui"] };

// ✅ app composes the shared contract
import { createNextConfig } from "@dival-sehgal/next-config";
export default createNextConfig({ images: { remotePatterns: [] } });
```

| **Config** | **Owner** | **Notes** |
|---|---|---|
| Build output | Shared package | Production invariant |
| Transpilation | Shared package | Workspace invariant |
| App image hosts | App config | Product-specific |

**Shared default** — use it when every app should behave the same.

**Local override** — use it when the app has a real unique requirement.

**Thin config** — makes exceptions visible during review.

## Scaling (consistency)
Attack: App-by-app upgrades — Next.js features, image rules, and Sass options are rolled out inconsistently.
Fix: Publish configuration changes once through the shared package.

```js
// ❌ five apps need the same manual edit
apps.forEach((app) => patchNextConfig(app));

// ✅ one package update changes the fleet
export const shared = {
  experimental: { externalDir: true },
};
```

| **Concern** | **Centralize?** | **Reason** |
|---|---|---|
| `externalDir` | Yes | Monorepo build invariant |
| CDN patterns | Usually | Shared asset policy |
| Feature flags | Depends | App rollout risk |

**Fleet change** — centralize when inconsistent behavior is worse than broad rollout.

**Feature flag** — keep app-local when rollout needs staged control.

**Review surface** — one package diff is easier to audit than many app diffs.

## Reliability (ci)
Attack: CI environment skew — one app builds locally but fails in the pipeline because config assumptions differ.
Fix: Put CI-critical settings in shared config and test them as package behavior.

```bash
# ❌ local app build is the only proof
yarn workspace web build

# ✅ shared package and app build are both verified
yarn workspace @dival-sehgal/next-config test
yarn workspace web build
```

| **Setting** | **Failure prevented** |
|---|---|
| `output` | Deployment artifact mismatch |
| `sassOptions` | Style import failures |
| `transpilePackages` | Workspace package compile errors |

**CI contract** — shared config is production infrastructure.

**Package tests** — validate config composition before apps consume it.

**Artifact shape** — deployment output should not vary per app accidentally.

## Boundaries (composition)
Attack: Shared package overreach — app-specific behavior gets buried in a global config helper.
Fix: Keep shared config composable and reserve local config for product concerns.

```js
// ❌ shared config knows one app's domain
images.remotePatterns.push({ hostname: "portfolio.example.com" });

// ✅ app provides product-specific inputs
export default createNextConfig({
  images: { remotePatterns: [{ hostname: "portfolio.example.com" }] },
});
```

| **Boundary** | **Belongs** |
|---|---|
| Monorepo mechanics | Shared package |
| Deployment invariant | Shared package |
| Product domain | App config |

**Composable helper** — accept overrides instead of hiding product decisions.

**Global default** — keep it boring and broadly valid.

**App exception** — document it where the app declares it.

## Critical Chain
Order matters because configuration drift turns a monorepo into many subtly different production systems.

    One app patches config locally
      -> another app misses the same build setting
      -> CI succeeds for one workspace and fails for another
      -> deployment artifacts differ by app
      -> developers copy fixes by hand
      -> shared infrastructure stops being shared
