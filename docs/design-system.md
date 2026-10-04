# Design system

How styling is put together in `apps/web`. Tokens come from
`packages/design-tokens` (Style Dictionary). Shared Sass lives in
`apps/web/src/styles/`, and the primitives are in `apps/web/src/components/ui/`.
For the cascade-layer rules, see [css-architecture.md](css-architecture.md).

## Tokens

Rebuild after you edit a JSON file: `cd packages/design-tokens && npm run build`.
In SCSS, use `$t-…`. In TS, import from `@dival-sehgal/design-tokens/light` or `/dark`.

| Category | Source | Examples | Use for |
|---|---|---|---|
| Colour (themed) | `semantic-colors.{light,dark}.json` | `$t-colors-text-primary`, `$t-colors-surface-brand-muted`, `$t-colors-feedback-error-text` | All UI colour. They compile to `var(--t-colors-…)`, so they switch with the theme at runtime. |
| Colour (fixed) | `colors-terminal.json`, `colors.json` | `$t-colors-terminal-bg`, `$t-foundation-colors-neutral-50` | Surfaces that look the same in both themes (terminal, lightbox overlay). |
| Data viz | `semantic-colors.*` → `data-viz.categorical.1…12` | `TColorsDataVizCategorical3` | Category colours in charts and SkillSphere. Each is ≥ 5:1 on the page background and ≥ 4.5:1 on `surface.section-alt`. |
| Spacing | `spacing.json` | `$t-spacing-4` (16px) | Padding, margin, gap and sizes, on a 4px grid. |
| Radius | `radius.json` | `$t-radius-xs/sm/md/lg/xl/full` | Corner rounding only. Use `50%` for circles. |
| Type | `font.json` | `$t-font-size-sm`, `$t-font-weight-semibold` | Text. Fluid display headings may use `clamp()`. |
| Motion | `motion.json` | `$t-motion-duration-base`, `$t-motion-easing-standard` | Transitions and entrance animations. |
| Shadow | `shadow.json` | `$t-shadow-sm/md/lg/xl/brand` | Elevation. Built on `colors.shadow-*`, so they follow the theme. |
| Blur | `blur.json` | `$t-blur-sm/md/lg/xl` | `backdrop-filter` / `filter`. |
| Layer | `layer.json` | `$t-layer-raised`, `$t-layer-modal` | Any `z-index` above the local 0/1/2 paint order. |
| Breakpoint | `breakpoint.json` | `$t-breakpoint-tablet` | Media queries. Use the `respond-up` / `respond-down` mixins or `(width >= …)` range syntax. |

### Choosing between them

- **Spacing or radius?** Spacing is the distance between or inside things.
  Radius is corner shape. Never use `$t-spacing-*` as a border-radius.
- **Durations.** Use `fast` (150ms) for presses and toggles, `base` (200ms) for
  hover and focus, `slow` (300ms) for surfaces and cards, `slower` (500ms) for
  entrances, and `slowest` (800ms) for showcase moves. Infinite loops such as
  spinners and shimmer can keep their own timing.
- **Easings.** Use `standard` for most things, `emphasized` for entrances, and
  `expressive` for hero reveals.
- **Layers, from bottom to top:**
  `raised` 10 → `sticky` 20 → `floating` 80 (top bar, FABs) → `navbar` / `popover` 90 → `toast` 92 → `modal` 93 → `skip-link` 95.
- **Translucent colour.** Write `color-mix(in srgb, #{$token} 10%, transparent)`.
  Never use `rgba($token, .1)`: themed tokens are `var()` strings, so Sass
  emits `rgba(var(--x), .1)`, which is invalid CSS that the browser drops.
  Stylelint blocks `rgb()` and `rgba()` for this reason.

## Shared mixins (`styles/mixins.scss`, `styles/_motion.scss`)

| Mixin | Purpose |
|---|---|
| `card($interactive: false)` | The single card surface: a glass fill with the pointer spotlight. `$interactive` adds the hover lift. Pair it with `<SpotlightGroup>`. |
| `focus-ring($offset: 2px)` | The keyboard focus indicator for custom interactive elements. ui primitives already include it. |
| `reduced-motion` | Wraps `@content` in `prefers-reduced-motion: reduce`. |
| `respond-up($bp)` / `respond-down($bp)` | Breakpoint media queries. |
| `keyframes-fade-in` / `keyframes-shimmer` / `keyframes-pulse` | Shared keyframes. CSS Modules scope animation names, so include the one you need in the module that uses it. |
| `heading-*`, `label-*`, `body-*` | Type presets. |
| `ellipsis($lines)` | Truncates text to one line or several. |

## Primitives

All of these live in `@layer components`. A consumer's CSS Module is unlayered,
so it overrides a primitive with a plain class selector and never needs
`!important`.

### Button — `ui/Button`

| Prop | Values | Default |
|---|---|---|
| `variant` | `contained` · `outlined` · `text` | `contained` |
| `size` | `small` (32px) · `medium` (40px) · `large` (48px) | `medium` |
| `fullWidth` | boolean | `false` |
| `loading` | boolean | `false` |
| `startIcon` / `endIcon` | node | — |
| `href` | string: renders an `<a>` | — |

**States.** Default, hover (brand tint or darker fill), active (pressed 1px plus
a deeper tint), focus-visible (2px primary outline, 2px offset), disabled
(`text.disabled` colour, `not-allowed` cursor), and loading (a spinner replaces
`startIcon`, `aria-busy`, clicks blocked, variant colours kept). There is no
error state: show errors next to the action, not on it.

**Accessibility.** Renders a native `<button type="button">` or an `<a>`. Enter
and Space activate it. Loading sets `aria-busy="true"` and disables the button;
on a link it sets `aria-disabled` and prevents navigation.

- **Do:** Use one `contained` button per view for the primary action.
- **Do:** Use `loading` while a submit is in flight.
- **Don't:** Build a raw `<button>` that looks like this one.
- **Don't:** Put `disabled` on a link. Use a button instead.

### IconButton — `ui/IconButton`

| Prop | Values | Default |
|---|---|---|
| `aria-label` | string (**required**) | — |
| `variant` | `ghost` (round, transparent) · `glass` (bordered square with hover glow) | `ghost` |
| `size` | `small` 32 · `medium` 40 · `large` 48 (`glass` is always 44) | `medium` |
| `href` | string: renders an `<a>` | — |

**States.** Default, hover (brand tint, or a glow for `glass`), active
(scale 0.94, or 0.92 for `glass`), focus-visible (primary outline), and disabled
(50% opacity).

**Accessibility.** The type requires an accessible name. Mark the icon inside
as `aria-hidden`. To explain the icon visually as well, wrap it in a `Tooltip`.

- **Do:** Use it for close, clear, send, copy and carousel arrows.
- **Don't:** Put visible text inside. Use `Button` for that.

### TextField — `ui/TextField`

| Prop | Values | Default |
|---|---|---|
| `variant` | `outlined` (forms) · `pill` (compact composer) | `outlined` |
| `label` | string (always required) | — |
| `hideLabel` | boolean: the label is visually hidden but still read by screen readers | `false` |
| `multiline` / `minRows` | textarea mode | `false` / 3 |
| `error` / `helperText` | the error state and its message | — |
| `endAdornment` | node shown inside the box, such as a send button | — |
| `placeholder`, `type`, `required`, `disabled`, `maxLength`, `autoComplete` | as for a native input | — |

**States.** Default, hover (tinted background), focus (focus-border colour plus
a 3px brand ring), disabled (disabled background and cursor), and error
(error-coloured border and helper text). There is no loading state; show it on
the submit button instead.

**Accessibility.** The `<label for>` is always present. `aria-invalid` follows
`error`. `aria-describedby` points to the helper text, and an error message gets
`role="alert"`.

- **Do:** Always pass `label`. Use `hideLabel` only when the context makes the
  field's purpose obvious, as in a chat composer.
- **Don't:** Use a placeholder as the only label.

### Tooltip — `ui/Tooltip`

Props: `title`, `side` (`top`, `right`, `bottom` or `left`; default `top`), and
`children` (one focusable element).

**States.** Hidden, then shown after a 250ms delay on hover or keyboard focus.
It animates in, and the animation is turned off under reduced motion.

**Accessibility.** Built on Radix. It is linked to its trigger with
`aria-describedby`, and Escape dismisses it.

- **Do:** Use it to give an icon-only button its visible meaning.
- **Don't:** Put interactive content or essential information in a tooltip,
  because touch users never see it.

### Spinner — `ui/Spinner`

Props: `size` (px, default 16), `aria-label` (default "Loading"), and `className`.

**States.** One indeterminate loop. Under reduced motion it spins more slowly
(2s per turn). Recolour it from the consumer with `border-color` and
`border-top-color`.

**Accessibility.** `role="progressbar"` plus a label. Give it a specific label,
such as "Loading view count".

### Skeleton — `ui/Skeleton`

Props: `variant` (`text`, `rectangular`, `rounded` or `circular`), `width`,
`height`, `className` and `style`.

**States.** A shimmering placeholder.

**Accessibility.** It is `aria-hidden`. Mark the region that is loading with
`aria-busy` on its container.

- **Do:** Match the size and shape of the content that will replace it.
- **Don't:** Use it for actions that are still pending. Use a Spinner or
  `Button loading` instead.

### GlassCard — `components/GlassCard`

The structured content card used for experience and projects. Its surface comes
from the `card` mixin, so other card-shaped layouts (blog listings) use the same
surface without copying this markup.

| Prop | Purpose |
|---|---|
| `title` | Heading (`h3`) |
| `description` | A string, or a list of `{ id, text }`. Lists longer than 2 items get a "Show N more" toggle. |
| `visual` | Optional media area |
| `tags` | Pill tags |
| `action` | A footer slot, such as a link |

**States.** Default and hover (spotlight glow and lit border follow the
pointer). The list toggle shows its expanded state with `aria-expanded`. Focus
goes to the links and buttons inside, not to the card itself.

- **Do:** Put the card's link in `action` so it gets a real focus target.
- **Don't:** Make the whole card clickable with `onClick` on the `div`.

## Guardrails (stylelint)

`npm run lint:style` enforces the following:

- No hex colours, and no `rgb()`, `rgba()`, `hsl()` or `hsla()`.
- Colour, background and border colours must be tokens.
- No `z-index` above 2 unless it is a `$t-layer-*` token.
- No `border-radius` of 3px or more unless it is a `$t-radius-*` token.
- No literal durations in `transition`.
- No pixel `blur()` values.

If you need a real exception, add a `stylelint-disable-line` comment with a
reason.
