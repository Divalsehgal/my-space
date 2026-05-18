CSS cascade layer control means making style precedence explicit so production bundling cannot change which layout rule wins.

## Layers (precedence)
Attack: Bundle-order override — global styles win in production because extraction and minification changed stylesheet order.
Fix: Declare cascade layers once and put broad defaults below component-owned styles.

```html
<style>
/* ❌ order decides the winner */
.section { padding-inline: 20px; }
.container { padding-inline: 40px; }
/* ✅ layer order decides the winner */
@layer base, utilities, components;
@layer base { .section { padding-block: 16px; } }
.container { padding-inline: 40px; }
</style>
```

| **Rule** | **Detail** |
|---|---|
| Layer order | Later declared layers outrank earlier layers |
| Unlayered CSS | Beats layered CSS at the same origin |
| Specificity | Still matters inside the same layer |

**Layer declaration** — put it before all layered rules.

**Base layer** — use it for resets, element defaults, and low-level page primitives.

**Unlayered module** — let component CSS Modules own component geometry.

## Ownership (boundaries)
Attack: Shared padding collision — page sections, containers, and components all set the same horizontal spacing.
Fix: Assign each layout concern one owner and remove duplicated axis control.

```html
<style>
/* ❌ two owners for horizontal rhythm */
.section { padding-inline: 24px; }
.fluidContainer { padding-inline: 40px; }
/* ✅ section owns vertical rhythm only */
.section { padding-block: 24px; }
.fluidContainer { padding-inline: clamp(20px, 4vw, 48px); }
</style>
```

| **Owner** | **Controls** | **Avoids** |
|---|---|---|
| Section | Vertical spacing | Container width drift |
| Container | Inline padding and max width | Double gutters |
| Component | Internal layout | Page-level coupling |

**Axis ownership** — vertical and horizontal spacing can have different owners.

**Container contract** — consumers should not patch its inline padding externally.

**Page primitive** — broad classes must be intentionally weak.

## Specificity (escape)
Attack: Specificity escalation — selectors become longer until local overrides require `!important`.
Fix: Reduce selector depth and move reusable defaults into weak layers.

```html
<style>
/* ❌ override requires a stronger selector */
main .page .section .title { margin-block: 0; }
.card .title { margin-block: 12px !important; }
/* ✅ weak default, local override */
@layer base { .title { margin-block: 0; } }
.cardTitle { margin-block: 12px; }
</style>
```

| **Token** | **Notes** |
|---|---|
| `!important` | Hides ownership mistakes |
| Deep selector | Couples style to DOM shape |
| Module class | Keeps override local and direct |

**Selector depth** — treat more than two structural hops as design debt.

**Important flag** — reserve it for external integration constraints.

**Local class** — prefer one clear class over ancestor-dependent selectors.

## Debugging (verification)
Attack: Dev-only confidence — the style is correct locally but breaks after production CSS extraction.
Fix: inspect cascade layer metadata and verify the production build, not only dev server behavior.

```js
// ❌ visual check only in dev
console.log("looks fine");

// ✅ inspect layer statements
const rules = [...document.styleSheets]
  .flatMap((sheet) => [...sheet.cssRules])
  .filter((rule) => rule.type === CSSRule.LAYER_STATEMENT_RULE);
console.log(rules);
```

| **Check** | **Prevents** |
|---|---|
| Production build | Extraction-order regressions |
| DevTools cascade | Misread specificity causes |
| Layer statement scan | Missing top-level declaration |

**Build parity** — CSS bugs often appear after optimization, not before it.

**Cascade panel** — read the winning rule and the losing rule together.

**Regression test** — snapshot critical layout dimensions when spacing matters.

## Critical Chain
Order matters because cascade decisions are global, and one broad rule can silently rewrite component layout after bundling.

    Global class owns component spacing
      -> production extraction changes stylesheet order
      -> component padding loses without a code change
      -> developer adds deeper selectors
      -> later override needs `!important`
      -> layout behavior becomes impossible to reason about
