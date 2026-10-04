# Design-system remediation — implementation prompt

> Paste everything below the line into a fresh Claude Code session at the repo root.
> Source: design-system audit of `apps/web/src` + `packages/design-tokens` (2026-10-03).

---

You are fixing design-system debt in this Next.js monorepo. Tokens live in
`packages/design-tokens/tokens/*.json` (Style Dictionary → `build/scss/variables.scss`,
`build/css/variables.{light,dark}.css`). Shared SCSS is `apps/web/src/styles/mixins.scss`
and `globals.scss`. Primitives are in `apps/web/src/components/ui/`. Read
`docs/css-architecture.md` first and follow its layer rules.

Work in the phases below, in order. After each phase run
`pnpm --filter web lint:style`, the web unit tests, and `pnpm --filter web build`,
then visually check the home page, a blog post (with a quiz), and the chatbot in
both light and dark themes. Commit once per phase. Do not change visual design
beyond what each item says.

## Phase 1 — Real bugs (do first)

1. **`rgba($token, α)` emits invalid CSS.** Semantic tokens are `var(--…)` strings,
   so Sass outputs `rgba(var(--t-colors-primary-default), 0.1)`, which resolves to
   `rgba(#4e598c, 0.1)` and the browser drops the declaration. Replace every
   occurrence with `color-mix(in srgb, #{$token} N%, transparent)` (the pattern
   `mixins.scss` already uses). Affected:
   - `components/BlogQuiz/QuestionCard/styles.module.scss` (lines ~21, 83, 126, 131, 187, 198, 203, 214, 307, 313)
   - `components/BlogQuiz/styles.module.scss` (~72, 81, 114, 162, 168)
   - `components/BlogQuiz/QuizResults/styles.module.scss` (~198)
   - `features/blog/AnimatedImageBlock/ImageLightbox/styles.module.scss` (~47)
   Note that several of these use `$t-colors-background-primary` as if it were
   white; in dark mode it is dark. Pick the semantically correct token (e.g. a
   `surface`/`border` token) rather than mixing background-primary.
   Verify in the built CSS that no `rgba(var(` remains.
2. **`glass-input` radius.** `mixins.scss` uses `border-radius: $t-spacing-full`
   (= `100%`), which draws an ellipse, not a pill. Switch to the new
   `$t-radius-full` (Phase 2) or `9999px`.
3. **Delete stale comments** in `ImageLightbox/styles.module.scss` lines 5–9
   (old hex → token mapping notes that no longer match the code).

## Phase 2 — Missing token categories

Add to `packages/design-tokens/tokens/` and rebuild:

- **`radius.json`** → `radius.none/xs(4)/sm(8)/md(12)/lg(16)/xl(24)/full(9999px)`.
  Replace all `border-radius: $t-spacing-*`, `$t-dimensions-1`, `9999px`,
  `12px`, `10px`, `8px` with radius tokens (keep `50%` for circles, `inherit`).
- **`motion.json`** → durations `fast(150ms)/base(200ms)/slow(300ms)/slower(500ms)`
  and easings `standard: cubic-bezier(0.4,0,0.2,1)`, `emphasized: cubic-bezier(0.22,1,0.36,1)`.
  Today there are ~15 duration/easing combos (`0.2s ease` ×59, `0.3s ease` ×42,
  `0.2s ease-in-out` ×19, `0.25s`, `0.4s`, …). Collapse onto the tokens.
- **`shadow.json` / elevation** → `sm/md/lg/xl` built on `colors.shadow-*`.
  Replace raw shadows in BlogQuiz, QuizResults, ImageLightbox, Terminal.
- **`blur.json`** → `sm(4)/md(8)/lg(12)/xl(20)`. There are 9 distinct blur values
  (4/6/8/10/12/16/18/20px + `$t-spacing-4`); collapse to the scale.
- **Semantic z-index.** `layer.json` only has `level-positive-1…9`, and just 3 are
  used; 24 raw `z-index` values exist, including `9999` in ImageLightbox. Add
  semantic aliases (`layer.base`, `raised`, `sticky`, `navbar`, `overlay`,
  `modal`, `toast`, `tooltip`) mapped onto the existing levels, and use them for
  every stacking context above the local `0/1/2` paint-order values.
- **Remove `dimensions.json`.** It duplicates `spacing.json` exactly; 13 usages vs
  596 for spacing. Migrate the 13 to spacing/radius and delete the file.
- **Remove `$t-spacing-full`** from spacing (100% is not a spacing value).

## Phase 3 — Hardcoded values

- **Terminal palette** (`components/Terminal/styles.module.scss` lines 5–17): 13
  hex literals. Move them into a `terminal` (or `code-surface`) semantic group in
  `semantic-colors.{light,dark}.json`, and reuse it in `CodeBlock` if they match.
- **Quiz option colors** (`components/BlogQuiz/types.ts` 40–66): `#22c55e`,
  `#6366f1`, `#f59e0b`, `#ef4444` → map to `colors.feedback.*`
  (success/info/warning/error) via CSS vars, not JS hex.
- **SkillSphere palettes** (`components/SkillSphere/index.tsx` 19–20): 24 hex
  values → a `data-viz.categorical.1…12` token set (light + dark), read through
  the generated TS token exports.
- **`app/layout.tsx` theme-color** (`#ffffff`, `#171717`) → import from the
  generated TS tokens so they can't drift from `background.primary`.
- **Raw px spacing/font-size**: 92 declarations, worst in
  `BlogQuiz/QuestionCard` (19), `BlogQuiz/QuizResults` (18), `Chatbot` (8),
  `Navbar` (7), `SkillSphere` (5). Map to spacing / font-size tokens; leave
  1px hairlines.
- **Breakpoints**: replace `@media (width <= 1024px)`, `(width >= 1200px)`,
  `(width <= 450px)` with token breakpoints (add `breakpoint.wide` /
  `breakpoint.mobile-sm` if genuinely needed). Standardize on one syntax —
  range syntax (`width >= $t-breakpoint-tablet`) — across all 90+ media queries,
  and add `respond-up($bp)` / `respond-down($bp)` mixins.
- **`!important`**: 53 uses. Audit `About` (9), `Navbar` (10), `Footer` (6),
  `ScrollToTop` (6) and `glass-button-nav`'s `color: … !important`. Remove where
  the cascade layers already guarantee precedence.

## Phase 4 — Duplicates / near-duplicates

- **Keyframes**: `ImageLoader` defines its own `spin`, `shimmer`, `pulse` while
  `ui/Spinner` (`spinner-turn`) and `ui/Skeleton` (`skeleton-wave`) exist. Make
  ImageLoader use `<Spinner>` / `<Skeleton>`. Also check `BlogListings` spinner
  styles. Move shared keyframes (`fade-in`, `spin`, `shimmer`) into one
  `styles/_motion.scss`.
- **Card surfaces**: `GlassCard` component + `card-glass` mixin +
  `spotlight-card` mixin + `BlogListings` card styles overlap. Make `GlassCard`
  the single card primitive (variants: `glass`, `spotlight`, `interactive`) and
  have `ExperienceCard`, `ProjectCard`, `RelatedPosts`, `BlogListings` compose it.
- **Buttons**: 22 raw `<button>` elements in 15 files bypass `ui/Button` /
  `ui/IconButton` (Navbar, Chatbot, ChatPanel, Terminal, Carousel, BlogQuiz ×3,
  GlassCard, SkillSphere ×2, Contact Form, SkillsViews, ImageLightbox,
  BlogViewTracker). Migrate the ones that are visually buttons; leave genuinely
  custom controls (e.g. quiz option tiles) but give them the shared focus ring.
  Then retire `glass-button-nav` (only Carousel uses it) in favour of an
  `IconButton variant="glass"`.
- **Inputs**: Chatbot `ChatPanel.tsx` (lines ~96, 244) uses raw `<input>`; move to
  `ui/TextField` (add a `variant="pill"`), then delete the unused `glass-input`
  mixin.
- **Mixins**: `body-md` is identical to `body-base` — delete `body-md` and
  migrate callers. Delete the deprecated `line-clamp` mixin after migrating to
  `ellipsis`. Delete the retired `.section__bg-pattern` rule in `globals.scss`.

## Phase 5 — Missing states

- **`ui/Button`**: add `loading` (renders `<Spinner>`, sets `aria-busy`, disables
  interaction) and give `outlined` / `text` variants a `:disabled` style (today
  only `contained` dims). Add an `:active` style for `outlined` / `text`.
- **Focus-visible**: these files have `:hover` styles but no focus style at all:
  `AnimatedImageBlock`, `ImageLightbox`, `Footer`, `SectionHeader`, `ScrollToTop`,
  `CodeBlock`, `RelatedPosts`, `BlogQuiz`, `QuizResults`, `Contact`, `About`,
  `Skills`, `HeroActions`, `BlogPost`. Add a shared `focus-ring` mixin
  (`outline: 2px solid $t-colors-focus-ring; outline-offset: 2px` on
  `:focus-visible`) and apply it wherever there's an interactive hover.
- **`outline: none` without a replacement**: check `QuestionCard:48`,
  `Chatbot:445`, `Toaster:102`, `BlogListings:255`, `ArchitectureDiagram:76/146`,
  and `glass-input`. Each must have a visible `:focus-visible` substitute
  (Terminal and CommandPalette already document theirs — leave them).
- **Error/disabled** for quiz options and chatbot input (no disabled styling
  while a response streams).

## Phase 6 — Accessibility

- **Reduced motion**: these animate with no `prefers-reduced-motion` guard:
  `ImageLoader`, `ui/Tooltip`, `Toaster`, `ScrollToTop`, `Chatbot`, `Terminal`,
  `CommandPalette`, `ArchitectureDiagram`. Add a `reduced-motion` mixin, or a
  single global rule in `globals.scss` `@layer base` that zeroes durations, and
  check the hover lift in `card-hover-lift`.
- **Contrast**: re-verify AA for the new quiz `color-mix` tints (Phase 1), the
  Terminal palette, and SkillSphere labels in both themes.
- **Raw buttons**: any `<button>` that stays raw must have `type="button"` and an
  accessible name; icon-only ones need `aria-label`.

## Phase 7 — Guardrails and docs

- Add stylelint rules: `color-no-hex` (allow in token build output),
  `declaration-property-value-disallowed-list` for `z-index` numbers > 2,
  `border-radius` px values, and `transition` raw durations;
  `scale-unlimited/declaration-strict-value` for `color`, `background-color`,
  `border-color`, `box-shadow`.
- Write `docs/design-system.md` with a section per primitive (Button,
  IconButton, TextField, Tooltip, Spinner, Skeleton, GlassCard): variants
  table, states (default/hover/active/focus/disabled/error/loading), a11y notes
  (role, keyboard, screen reader), and do/don't examples. Include the token
  categories and when to use spacing vs radius vs layer tokens.

## Done when

- No `rgba(var(` in built CSS; no hex outside `packages/design-tokens`.
- `grep -rE 'z-index:\s*[0-9]{2,}'`, raw `border-radius: [0-9]+px`, and raw
  `[0-9.]+s ease` return nothing in `apps/web/src`.
- Every file with `:hover` on an interactive element also has `:focus-visible`.
- Every file with `@keyframes`/`animation` respects reduced motion.
- Stylelint, unit tests, Playwright e2e, and the build pass.
