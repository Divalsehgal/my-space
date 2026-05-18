Design-system integration means routing visual decisions through semantic tokens so themes can change without rewriting components.

## Tokens (semantics)
Attack: Raw value coupling — components hardcode colors and spacing that cannot adapt to light mode, dark mode, or brand changes.
Fix: Consume semantic tokens in app code and keep foundation tokens inside the token package.

```js
// ❌ component owns a raw visual value
const style = { color: "#ffffff", padding: "24px" };

// ✅ component consumes semantic roles
const style = {
  color: "var(--t-colors-text-primary)",
  padding: "var(--t-spacing-6)",
};
```

| **Token** | **Owner** | **Use** |
|---|---|---|
| Foundation color | Token package | Palette source |
| Semantic color | App components | Runtime theme role |
| Spacing token | App components | Layout rhythm |

**Semantic role** — describes intent, not the current hex value.

**Foundation token** — build semantic tokens from it; do not style components with it.

**Runtime variable** — allows theme switches without React re-rendering every style.

## Generation (outputs)
Attack: Manual token drift — CSS, SCSS, and TypeScript values diverge because each is maintained separately.
Fix: Generate all platform outputs from the same token source.

```bash
# ❌ edit generated files directly
vim packages/design-tokens/build/css/variables.light.css

# ✅ edit source, then rebuild
vim packages/design-tokens/tokens/semantic-colors.light.json
yarn workspace @dival-sehgal/design-tokens build
```

| **Output** | **Consumer** | **Purpose** |
|---|---|---|
| CSS variables | Browser runtime | Theme switching |
| SCSS variables | CSS modules | Component styling |
| TS variables | MUI theme | Theme object creation |

**Generated file** — treat it as build output.

**Source token** — review changes at the semantic layer.

**Build step** — run it before testing theme behavior.

## Bootstrap (flash)
Attack: Theme flash — dark-mode users see light colors before React hydrates.
Fix: Set `data-theme` and `color-scheme` in the document head before first paint.

```js
// ❌ theme waits for hydration
useEffect(() => setTheme(localStorage.theme), []);

// ✅ theme is set before React starts
const mode = localStorage.getItem("theme-mode") || "dark";
document.documentElement.setAttribute("data-theme", mode);
document.documentElement.style.colorScheme = mode;
```

| **Signal** | **Priority** | **Notes** |
|---|---|---|
| Stored mode | Highest | User override |
| System mode | Fallback | `prefers-color-scheme` |
| Default mode | Last | Stable no-storage path |

**Head script** — runs early enough to affect first paint.

**`data-theme`** — switches CSS variables.

**`color-scheme`** — aligns native form controls and browser UI.

## Baseline (runtime)
Attack: Static theme mismatch — MUI baseline uses imported token values that do not react to runtime theme changes.
Fix: Use CSS variables for baseline background and text color.

```js
// ❌ static value cannot follow data-theme
body: { backgroundColor: LightTokens.background.primary }

// ✅ runtime variable follows theme changes
body: {
  backgroundColor: "var(--t-colors-background-primary)",
  color: "var(--t-colors-text-secondary)",
}
```

| **Layer** | **Controls** | **Constraint** |
|---|---|---|
| Global CSS | Base body styles | Must use variables |
| MUI baseline | Component library reset | Must match global CSS |
| Theme context | User preference | Writes document state |

**Baseline parity** — global CSS and MUI baseline should agree.

**Body text** — use secondary text when primary is reserved for high emphasis.

**Runtime switch** — CSS variables should carry the visual change.

## Critical Chain
Order matters because a token system fails when raw values bypass the semantic layer and runtime theme state.

    Component hardcodes a foundation color
      -> dark mode receives a light-mode assumption
      -> MUI baseline uses a different source than CSS modules
      -> theme toggle changes only part of the page
      -> developers patch individual components
      -> design consistency becomes impossible to maintain
