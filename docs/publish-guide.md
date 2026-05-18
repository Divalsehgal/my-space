NPM publishing control means verifying package contents, versions, and side effects before shared workspace code becomes an external contract.

## Identity (scope)
Attack: Wrong package target — a package publishes under the wrong scope, access level, or registry identity.
Fix: authenticate first and verify the package name, registry, and access mode before publish.

```bash
# ❌ publish before identity is verified
npm publish

# ✅ confirm account and package target
npm whoami
npm publish --dry-run
```

| **Check** | **Prevents** |
|---|---|
| `npm whoami` | Wrong account publish |
| Package scope | Wrong namespace |
| Access mode | Private package surprise |

**Scope** — `@divalsehgal/*` requires the matching npm org or user scope.

**Registry** — verify `.npmrc` before release.

**Access** — scoped public packages need `--access public`.

## Dry Run (contents)
Attack: Artifact leak — source logs, build caches, or missing generated files ship in the package tarball.
Fix: inspect the dry-run output before every publish.

```bash
# ❌ publish blind
npm publish --access public

# ✅ inspect package contents first
cd packages/design-tokens
npm publish --dry-run
```

| **Artifact** | **Publish rule** |
|---|---|
| Build output | Include when package consumers need it |
| Source tokens | Include when consumers customize |
| Cache logs | Exclude from package |

**Dry run** — the tarball preview is the source of truth.

**Files field** — use it to define the package surface.

**Generated output** — build before dry run.

## Versioning (contract)
Attack: Silent breaking change — consumers receive incompatible exports under a patch version.
Fix: choose version increments based on package API changes, not implementation effort.

```bash
# ❌ breaking export change as patch
npm version patch

# ✅ version matches contract change
npm version major
npm publish --access public
```

| **Change** | **Version** |
|---|---|
| Bug fix | Patch |
| New compatible export | Minor |
| Removed or changed export | Major |

**Package API** — exports, CSS entry points, and token names are public contracts.

**Consumer impact** — version by what breaks downstream.

**Lockfile** — update it intentionally after version changes.

## Side Effects (bundling)
Attack: Broken tree shaking — CSS side effects are removed or JavaScript side effects block optimization.
Fix: declare `sideEffects` according to each package's runtime behavior.

```js
// ❌ CSS can be dropped accidentally
{ "sideEffects": false }

// ✅ CSS entry points are preserved
{
  "sideEffects": ["*.css"]
}
```

| **Package** | **Side-effect rule** |
|---|---|
| Design tokens JS | Usually side-effect free |
| Token CSS | Must be preserved |
| Font CSS | Must be preserved |

**Tree shaking** — only safe when imports have no runtime effects.

**CSS import** — always a side effect from the bundler's perspective.

**Consumer build** — test published packages in a clean app.

## Critical Chain
Order matters because publishing turns local workspace assumptions into permanent external contracts.

    Package publishes without a dry run
      -> tarball misses generated CSS
      -> consumer imports the documented entry point
      -> app builds without required variables
      -> patch release changes exports again
      -> downstream projects stop trusting the package contract
