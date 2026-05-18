TypeScript type-system control means keeping contracts traceable so application boundaries fail at compile time instead of runtime.

## Barrels (imports)
Attack: Path drift — components import shared types from internal files until refactors become breaking changes.
Fix: Re-export shared types from one domain barrel and import through it.

```js
// ❌ leaks internal file layout
import type { BreadcrumbItem } from "@/types/ui";

// ✅ stable public type surface
import type { BreadcrumbItem } from "@/types";
```

| **Import** | **Notes** |
|---|---|
| Barrel | Stable public API for shared types |
| Domain file | Owns the source declaration |
| Component file | Owns private prop types |

**Barrel export** — use it for cross-module types only.

**Internal path** — avoid it unless the type is intentionally private.

**Refactor cost** — stable imports make file moves cheap.

## Shapes (contracts)
Attack: Type ambiguity — object contracts, unions, and inferred schema types all use the same construct.
Fix: Use `interface` for extensible object contracts and `type` for unions, mapped types, and schema inference.

```js
// ❌ union modeled as an interface concept
interface Severity { value: "success" | "error" }

// ✅ each construct matches the shape
interface ToastContext { showToast(message: string): void }
type Severity = "success" | "error";
```

| **Construct** | **Use** |
|---|---|
| `interface` | Public object contracts |
| `type` | Unions, tuples, mapped types |
| `z.infer` | Runtime schema-derived types |

**Object contract** — prefer `interface` when extension is expected.

**Union value** — prefer `type` for closed sets.

**Schema output** — infer from Zod instead of duplicating by hand.

## Globals (ambient)
Attack: Hidden namespace coupling — global declarations are used to avoid imports.
Fix: Reserve ambient types for environment, platform, and library augmentation.

```js
// ❌ global shortcut hides ownership
declare global { type ToastSeverity = "success" | "error"; }

// ✅ explicit import keeps ownership visible
export type ToastSeverity = "success" | "error";
import type { ToastSeverity } from "@/types";
```

| **Global type** | **Allowed?** | **Reason** |
|---|---|---|
| `Window.gtag` | Yes | Platform augmentation |
| `ProcessEnv` | Yes | Environment typing |
| App domain type | No | Should be imported |

**Ambient declaration** — use it when a runtime global already exists.

**Domain model** — import it from its owner.

**Code splitting** — global shortcuts make dependencies harder to trace.

## Colocation (ownership)
Attack: Type dumping — every prop, service response, and schema output lands in `src/types`.
Fix: Keep private types with their module and move only shared contracts to domain files.

```js
// ❌ private prop type exported globally
export interface CardProps { title: string }

// ✅ private until another module needs it
interface CardProps { title: string }
export function Card(props: CardProps) {}
```

| **Type** | **Location** | **Reason** |
|---|---|---|
| Component props | Component file | Private API |
| Shared UI contract | `src/types/ui.ts` | Cross-module use |
| Zod config type | Schema file | Runtime contract owner |

**One-module type** — keep it local.

**Two-module type** — promote it to a domain file.

**Schema-derived type** — keep it next to the schema.

## Critical Chain
Order matters because type ownership determines whether refactors are local edits or application-wide breakages.

    Shared type is imported from an internal file
      -> component code depends on folder layout
      -> refactor moves the domain file
      -> imports break across unrelated modules
      -> developer adds global shortcuts
      -> contract ownership disappears from the codebase
