# CSS Architecture & Layer Strategy

## Overview

This project uses **CSS Cascade Layers** (`@layer`) to manage styling precedence and prevent specificity conflicts, especially in production where minification changes code order.

## Problem Statement

### Why Layers Matter

In development, styles load in a predictable order:

```
globals.scss → component.module.scss
```

But in production after minification/bundling, the order becomes unreliable. **CSS Layers solve this by establishing a explicit precedence rule that works regardless of load order.**

### The Core Issue: `.section` Overriding `FluidContainer`

**❌ PROBLEM:**

```scss
// globals.scss - .section sets horizontal padding
.section {
  padding-left: 20px;
  padding-right: 20px;
}

// FluidContainer/styles.module.scss - tries to override
.fluid-container {
  padding-left: 40px;
  padding-right: 40px;
}
```

In development, if `globals.scss` loads last, it wins. In production, if `globals.scss` is bundled first (common in build processes), `globals.scss` wins regardless of specificity.

**✓ SOLUTION: CSS Layers**

CSS Layers establish an explicit hierarchy:

```scss
// globals.scss
@layer base, utilities, components; // Declare order first

@layer base {
  .section {
    // Vertical padding ONLY
    padding-top: 16px;
    padding-bottom: 16px;
    // ❌ NO horizontal padding
  }
}

// FluidContainer/styles.module.scss (UNLAYERED)
.fluid-container {
  // These styles ALWAYS win (unlayered > any layer)
  padding-left: 40px;
  padding-right: 40px;
}
```

## CSS Layer Hierarchy

```
Priority Order (highest to lowest):
1. ⭐ UNLAYERED (CSS Modules) ← Component styles always win
2. @layer components        ← Specific component base styles
3. @layer utilities         ← Reusable utility classes
4. @layer base              ← Global defaults & resets
```

**Key Principle:** Unlayered CSS always beats any layered CSS, regardless of specificity or load order. This is a CSS spec feature, not a hack.

## File Structure

### `src/styles/globals.scss` (LAYERED)

```scss
@layer base, utilities, components; // Must be first

@layer base {
  // Global resets
  * {
    margin: 0;
    padding: 0;
  }

  // Section layouts (vertical padding ONLY)
  .section {
    padding-top: 16px;
    padding-bottom: 16px;
    // ❌ NEVER: padding-left, padding-right
  }
}

@layer utilities {
  // Scroll snap utilities
  .snap-proximity {
    scroll-snap-type: y proximity;
  }
}

@layer components {
  // Global component baselines (rarely needed)
  // If added, ensure it doesn't conflict with CSS Modules
}
```

### `src/components/FluidContainer/styles.module.scss` (UNLAYERED)

```scss
// This file is UNLAYERED (Next.js default for .module.scss)
// It ALWAYS overrides .section padding from @layer base

.fluid-container {
  padding-left: 40px; // ✓ These always win
  padding-right: 40px; // ✓ Over the @layer base rules
}
```

### Component-Specific Styles (UNLAYERED)

```scss
// src/containers/Home/About/styles.module.scss (UNLAYERED)

.about {
  // Component top-level layout, margins, etc.
  margin-top: 20px; // ✓ Fine - this doesn't conflict with .section
}
```

## Rules & Guidelines

### ✓ DO:

- Use `@layer base, utilities, components;` declaration at the top of `globals.scss`
- Keep `.section` vertical padding in `@layer base`
- Keep component styles in unlayered CSS Modules (default in Next.js)
- Document why styles live in each layer
- Test in production build to catch specificity issues early

### ❌ DON'T:

- Set horizontal padding on `.section` (reserve for FluidContainer)
- Mix layered and unlayered styles within the same file without clear intent
- Use `!important` to override layer precedence (defeats the purpose)
- Add component styles to `globals.scss` without putting them in `@layer components`
- Rely on stylesheet load order to determine style precedence

### ⚠️ ANTI-PATTERNS:

```scss
// ❌ BAD: Specificity wars
.section {
  padding-left: 20px !important; // Don't force layer issues
}

// ❌ BAD: Horizontal padding in base layer
.section {
  padding-left: 20px; // Conflicts with FluidContainer
  padding-right: 20px;
}

// ❌ BAD: Layered and unlayered mixed without clarity
@layer base {
  .component {
    color: red;
  }
}
// (In same file) unlayered .component { color: blue; } — confusing!
```

## How to Debug Styles in Production

### 1. Use DevTools Cascade Panel

```
Browser DevTools > Elements panel > Styles tab
Look at the "Cascade" section to see which styles won
```

### 2. Verify Layer Order

```javascript
// In browser console
const layers = Array.from(document.styleSheets)
  .filter((sheet) => sheet.cssRules)
  .flatMap((sheet) => Array.from(sheet.cssRules))
  .filter((rule) => rule.type === CSSRule.LAYER_STATEMENT_RULE);

console.log(layers); // See declared layer names and order
```

### 3. Check Specificity

- Using a selector of equal specificity? CSS Layers are the tiebreaker.
- See a selector is losing in production but winning in dev? CSS Layers.

### 4. Test Both Builds

```bash
# Development (styles load in order)
npm run dev
# ✓ Verify layout looks correct

# Production (styles minified, bundled)
npm run build
npm run start
# ✓ Verify layout still looks correct — if not, it's a layer issue!
```

## Common Pitfalls & Solutions

### Issue: Layout Breaks After Production Build

**Cause:** Horizontal padding on `.section` in `@layer base` is overriding FluidContainer

**Solution:**

1. Open `globals.scss`
2. Find `.section` rule
3. Remove any `padding-left` or `padding-right`
4. Keep only `padding-top` and `padding-bottom`
5. Verify FluidContainer has the horizontal padding

### Issue: Component Styles Not Applying

**Cause:** CSS Module defined but layered styles are overriding

**Solution:**

1. CSS Modules should NOT be in any `@layer` (Next.js default)
2. If you added `@layer components` inside a component style, remove it
3. Verify the component style file is `.module.scss` (not `.scss`)

### Issue: Utilities Not Applying

**Cause:** Utilities in global styles but being overridden by component CSS

**Solution:**

1. Utilities should be in `@layer utilities`
2. Component CSS Modules (unlayered) will always override utilities ✓ (intended)
3. To make utilities override component styles, you'd need to add a more specific selector (but don't do this — use scoped variables instead)

## Best Practices Checklist

- [ ] `globals.scss` starts with `@layer base, utilities, components;`
- [ ] `.section` has ONLY `padding-top` and `padding-bottom`
- [ ] FluidContainer has ONLY `padding-left` and `padding-right`
- [ ] All global styles are within an `@layer` block
- [ ] Component CSS Modules are unlayered (default .module.scss)
- [ ] Tested in both `npm run dev` and `npm run build && npm run start`
- [ ] Used DevTools cascade panel to verify precedence

## References

- [MDN: Cascade Layers](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer)
- [CSS Spec: Layered Style Rules](https://www.w3.org/TR/css-cascade-5/#layer-rules)
- [Next.js CSS Modules](https://nextjs.org/docs/app/building-your-application/styling/css-modules)

## Quick Checklist for New Sections

When adding a new section, follow this pattern:

```tsx
// src/containers/Home/NewSection/index.tsx
"use client";
import styles from "./styles.module.scss";
import FluidContainer from "@/components/FluidContainer";

export default function NewSection() {
  return (
    <FluidContainer
      as="section"
      id="new-section"
      className={clsx("section", styles.newSection)} // ✓ Both classes
    >
      {/* content */}
    </FluidContainer>
  );
}
```

```scss
// src/containers/Home/NewSection/styles.module.scss (UNLAYERED)

.newSection {
  // Add content spacing, layout, etc.
  // The .section parent + this module work together
  // .section provides vertical padding (from @layer base)
  // FluidContainer provides horizontal padding (CSS Module, unlayered)
  // This file adds component-specific styling (CSS Module, unlayered)
}
```

This ensures consistent, production-safe styling across all sections.
