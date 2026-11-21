# Code audit: architecture, dependencies, duplication, performance

Read-only review of the whole monorepo (as of `a7217ff`). Findings are ranked by impact.
Size: **S** = under an hour, **M** = half a day, **L** = a day or more.

Not covered here, because parallel sessions are reworking them: Worker internals and SCSS
mixins (worker-refactor), the architecture widget (arch-widget), and the bundle-size report
(bundle-report). Where one of those sessions might miss something, it is flagged under
"Notes for parallel sessions" at the end.

No build was run (the dev server on :3000 was up), so bundle claims come from reading the
import graph, not from measured chunk sizes. Cross-check them against the bundle report.

---

## High impact

### 1. The root layout's two data fetches run one after the other
`apps/web/src/app/layout.tsx:157-158`. The same thing happens in `apps/web/src/app/page.tsx:29-31`.

`await portfolioService.getConfig()` has to finish before `getContentfulPostTitles()` even
starts. Every page that misses the cache waits for both fetches back to back, and the home
page makes the same mistake a second time.

**Fix:** `const [{ config }, posts] = await Promise.all([portfolioService.getConfig(), getContentfulPostTitles()])`. Do the same in `page.tsx`. **S**

### 2. If GitHub is slow or down, every page waits up to ~7 s and then fails
`apps/web/src/features/portfolio/portfolio.service.ts:18-42`. It is called from `layout.tsx:157`.

The portfolio config comes from GitHub raw, with 3 retries and a 1 s base backoff
(1 + 2 + 4 s). After that the error is rethrown. Because the root layout awaits it, a GitHub
outage or a schema-validation failure on a cold cache becomes a 500 on **every** route,
blog posts included, even though they don't need the config. Next's data cache usually
serves stale data, but a fresh deploy, a new region, or a `revalidateTag("portfolio")`
leaves nothing cached to serve.

**Fix:** ship a bundled fallback snapshot (for example `src/generated/portfolio.json`
written at prebuild) and return it when the fetch or the parse fails. Cut the layout-path
retries to 1, with a short timeout. **M**

### 3. Every route ships framer-motion (and the StackGame UI) in the layout bundle
- `apps/web/src/components/GamePrompt/index.tsx:4-6`: imports `framer-motion` and the whole `StackGame` component without lazy loading. Only `StackGame/Scene` (three.js) is dynamic.
- `apps/web/src/components/Navbar/NavLinks/index.tsx:6,28`: imports full `motion` for a single `layoutId` highlight.
- `apps/web/src/components/Chatbot/index.tsx:6`: same (the launcher button). It is dynamic, but it loads right after hydration on every page.

Because GamePrompt and Navbar sit in the root layout, the full framer-motion runtime
(~35-45 KB gz) is in the shared first-load JS of every page. Most pages never animate
anything with it.

**Fix:** (a) Put the game modal behind `dynamic(() => import("@/components/StackGame"), { ssr: false })` so it loads only when the prompt opens.
(b) Use `LazyMotion` + `m` with `domAnimation` (or `domMax` where `layoutId` is needed) in a small `MotionProvider` inside `Providers`, and switch the `motion.*` imports to `m.*`.
(c) Or swap the NavLinks highlight for a CSS transition and drop motion from the layout path completely. **M**

### 4. The Chatbot bundle downloads on every page view, even if nobody opens the chat
`apps/web/src/components/Providers/index.tsx:10`.

`dynamic(..., { ssr: false })` only skips SSR. The chunk (launcher + framer-motion) is
still fetched and run right after hydration on every route. `ChatPanel` (with
`react-markdown`) is split off correctly, but the launcher itself doesn't need to be React
+ motion before idle.

**Fix:** render a plain CSS launcher button and import the `Chatbot` chunk on the first
pointerenter/focus/click (or `requestIdleCallback`). **S-M**

### 5. A fixed `generateBuildId` makes every deploy share the same build ID
`apps/web/next.config.ts:84` sets `generateBuildId: () => "portfolio-blog-build"`.

Next uses the build ID to tell deploys apart (RSC/data payload URLs, the ISR cache, skew
detection). With a constant ID, a browser tab still running the old client can request
payloads from the new server without Next noticing the mismatch. You also lose the
built-in "new deployment → hard navigation" safety. Static chunk hashes still change, so
the risk is in the RSC/data layer, not in CSS/JS caching.

**Fix:** delete the line (Next's default is a random ID, and Vercel uses the commit SHA).
If something depends on a stable value, use `process.env.VERCEL_GIT_COMMIT_SHA`. **S**

### 6. BlogQuiz and the image lightbox load eagerly on every blog post
- `apps/web/src/containers/BlogPost/BlogPostArticle/index.tsx:9,72`: `BlogQuiz` (client, framer-motion, 4 sub-components) is imported statically. It renders only when `post.quiz` exists, at the bottom of the post.
- `apps/web/src/features/blog/AnimatedImageBlock/index.tsx:7`: `ImageLightbox` is imported statically but shows only after a click.

**Fix:** `const BlogQuiz = dynamic(() => import("@/components/BlogQuiz"))` (keep SSR so the
quiz markup still renders) and `dynamic(() => import("./ImageLightbox"), { ssr: false })`. **S**

---

## Medium impact

### 7. A 1,000-particle canvas animates on every blog, blogs-list and architecture page
`apps/web/src/components/Breadcrumbs/index.tsx:33-37` (count 1000), `apps/web/src/components/HomeTopBar/index.tsx:28-32` (count 1000), and `apps/web/src/components/ParticlesBackground/index.tsx:22`.

The engine is lazy-loaded (good), but a breadcrumb strip doesn't need 1,000 particles redrawn
every frame. On low-end phones that costs main-thread time during reading, which hurts INP.
The `PARTICLE_COUNT = 4000` default also contradicts the comment above it ("deliberately
small"), and nothing uses the default.

**Fix:** drop the strips to ~150-250 particles, set `fpsLimit: 30`, pause when off-screen
(IntersectionObserver), and skip the canvas entirely under `prefers-reduced-motion`. Set
the default to the real value, or delete it. **S**

### 8. Every post-list fetch pulls the full rich-text body of up to 100 posts
`apps/web/src/lib/services/contentful.ts:82-116` is used by `app/page.tsx:31`, `app/blogs/page.tsx:30`, `app/blogs/[slug]/page.tsx:25,142` and `app/llms.txt/route.ts:10`.

`body { json }` is requested only to compute a one-sentence card description. The result
is cached, but each revalidation pulls every post's body. The cached entry is large and is
loaded on every blog page, just to pick 3 related posts.

**Fix:** add a short `excerpt`/`description` field in Contentful (or compute it once in a
webhook/prebuild step) and query only title/slug/date/excerpt for lists. Keep `body` for
`getContentfulPostBySlug`. **M** (needs a content-model change)

### 9. The Contentful Management API client is written three times in the quiz app
- `apps/contentful-quiz-app/server/contentful.js:46-115` (pacing + retry)
- `apps/contentful-quiz-app/scripts/sync-content-model.mjs:14-30`
- `apps/contentful-quiz-app/scripts/migrate-quiz-content.mjs:15-30`
- plus similar hand-rolled fetches in `apps/web/scripts/contentful-translations.mjs`, `sync-translations.mjs` and `check-contentful-tokens.mjs`

Each copy builds its own base URL and auth header, and handles errors its own way. Only
the server copy handles 429 rate limits, so the scripts can fail halfway through a
migration.

**Fix:** have the two quiz-app scripts import `contentfulRequest`/`getContentfulConfig`
from `server/contentful.js`. Leave the web scripts for later, or move them into a tiny
`packages/contentful-cma` (plain JS) if they keep growing. **S** for the quiz app, **M** for everything.

### 10. Duplicated constants and helpers
| Duplicate | Where | Fix |
|---|---|---|
| `HTTP_STATUS` | `apps/contentful-quiz-app/server/http.js:2` vs `packages/utils/src/http.ts:2` | The quiz server is plain Node with no TS step, so the copy is deliberate. Note that in the file, or ship `packages/utils/src/http.ts` as `.js` + `.d.ts` (like `packages/quiz`) and import it. **S** |
| Retry with backoff | `apps/contentful-quiz-app/server/contentful.js:60-84` vs `packages/utils/src/fetchWithRetry.ts` | Same reason (plain JS). Merge when/if `utils` ships JS. **S** |
| `OWNER_FLAG_COOKIE = "owner_mode"` | `apps/web/src/utils/ownerMode.ts:10` vs `apps/web/src/lib/owner/index.ts:12` | `lib/owner` is server-side (it reads secrets), so move the constant to a tiny shared `lib/owner/constants.ts` and import it in both. **S** |
| Contentful "posts" queries | `lib/services/contentful.ts:82` and `lib/services/contentful-context.ts:11`: same collection, almost the same fields | Fine to keep two queries, but put the GraphQL strings in `lib/contentful/queries.ts` with the existing `BLOG_POST_BY_SLUG_QUERY`, so they live in one place. `contentful-context.ts:6` also re-exports `contentfulToPlainText`, which nothing imports through that path, so drop it. **S** |

### 11. Duplicated / dead `optimizePackageImports` config
`packages/next-config/next.config.ts:9-15` and `apps/web/next.config.ts:89-100`.

The app config overwrites the shared `experimental` block with an identical list, so the
shared one is dead. `experimental.externalDir` from the shared config is also **lost**,
because `{...config, experimental: {...}}` replaces the whole object. `framer-motion` is
already in Next's default optimized list, and `@radix-ui/react-toast`/`-tooltip` aren't
barrel packages, so those entries do nothing.

**Fix:** keep one list, in the shared config, and spread it:
`experimental: { ...config.experimental, serverComponentsHmrCache: false }`. Check whether
`externalDir` is still needed (with `transpilePackages` it usually isn't), then keep it or
delete it on purpose. **S**

### 12. Workspace packages declare `next` as a dependency instead of a peer
`packages/fonts/package.json:9` and `packages/next-config/package.json:7` pin `"next": "16.3.8"` in `dependencies`.

If the app's `next` version drifts from these pins, yarn installs a second copy of Next
under the package. You then get two React/Next module instances ("Invalid hook call", a
font loader that doesn't match the app's).

**Fix:** move it to `peerDependencies` (`"next": ">=16"`) plus `devDependencies`. **S**

### 13. Undeclared and misplaced dependencies
- `apps/web/src/app/layout.tsx:20` imports `@dival-sehgal/fonts/next`, but `apps/web/package.json` doesn't list `@dival-sehgal/fonts`. It only works because yarn hoists workspaces. Add `"@dival-sehgal/fonts": "*"`. **S**
- `apps/contentful-quiz-app/package.json:22`: `concurrently` is a dev-only tool sitting in `dependencies`, so it ends up in the production image (Dockerfile). Move it to `devDependencies`. **S**
- `apps/web/package.json`: `three` + `@react-three/fiber` (StackGame + SkillSphere only) and `@xyflow/react` (architecture page only) are correctly lazy. Nothing is unused: every runtime dependency has at least one import site. Re-check `@tsparticles/engine` (imported for **types only**, `ParticlesBackground/index.tsx:5`). It is a real transitive dependency of `@tsparticles/slim`, so keeping it pinned is fine, but `devDependencies` would be more honest.

### 14. Dead shared-UI export
`packages/ui/package.json` exports `./skeleton`, but nothing in `apps/` imports `@dival-sehgal/ui/skeleton`.
Delete `packages/ui/src/Skeleton` and the export, or start using it in `app/**/loading.tsx` (there are none today). **S**

---

## Low impact / consistency

### 15. `lib/` vs `utils/` has no clear rule
`apps/web/src/lib` and `apps/web/src/utils` both hold framework-free helpers. Today:
`utils/analytics.ts` is client-side gtag tracking, while `lib/services/analytics.ts` is
server-side Redis view counts. Same name, opposite runtimes. `utils/ownerMode.ts` (client)
pairs with `lib/owner` (server).

**Fix:** pick one rule and write it in the README, for example: `lib/` = server or
isomorphic modules grouped by domain (`lib/owner/{server,client}.ts`,
`lib/analytics/{server,client}.ts`), and no `utils/` folder in the app (generic helpers
belong in `packages/utils`). Move the five `utils/*` files. **M** (mechanical, but touches many imports)

### 16. Mixed file-naming conventions
In the same app you find kebab-case (`lib/site-index.ts`, `lib/site-events.ts`,
`lib/contentful/plain-text.ts`, `lib/services/contentful-context.ts`), camelCase
(`lib/contentful/imageLoader.ts`, `utils/contactRemember.ts`, `utils/humanizeSkillKey.ts`,
`features/portfolio/skillLevel.ts`), dot-suffix (`features/portfolio/portfolio.service.ts`),
and folder + `index.ts` (`lib/motion/`, `lib/scroll/`, `lib/owner/`). Components are
consistent (PascalCase folder + `index.tsx` + `styles.module.scss`). Keep that.

**Fix:** use kebab-case for non-component modules (it already matches `packages/utils`'
export names like `fetch-with-retry`) and add `eslint-plugin-check-file` or
`unicorn/filename-case` to `packages/eslint-config` so it stays consistent. Rename in one
commit. **S-M**

### 17. Mixed quote style and `"use client"` spelling
53 files use `"use client"`, 5 use `'use client'` (for example `components/BlogQuiz/*`,
`components/CodeBlock`, `components/GoogleTracking`, `features/blog/AnimatedImageBlock/ImageLightbox`),
and those files use single quotes throughout. Add Prettier (or ESLint `quotes`) to the shared
config and run it once. **S**

### 18. `context/` folder vs colocated providers
`src/context/ThemeContext.tsx` and `ToastContext.tsx` live in their own folder, while
`components/SiteIndex` and `i18n/client` define their contexts inside the component/feature.
Not wrong, just inconsistent. Fold `context/` into `components/Providers/` (or the
reverse) the next time you touch it. **S**

### 19. Preview page pulls the whole `graphql` parser into a client bundle
`apps/web/src/containers/BlogPostPreview/index.tsx:4,12`.

`parse(BLOG_POST_BY_SLUG_QUERY)` runs in the browser, so the `graphql` package (~40 KB gz)
ships to the client. It only affects the Contentful preview route, so the impact is low.
**Fix:** parse once on the server and pass the `DocumentNode` as a prop (it is plain JSON),
or use `graphql-tag`'s precompiled output. **S**

### 20. Production source maps are public
`packages/next-config/next.config.ts:6` sets `productionBrowserSourceMaps: true`.

That publishes the original source of every client file and makes builds slower. If it is
only there for error tracking, upload maps to the tracker and turn this off. **S**

### 21. `design-tokens` package hygiene
`packages/design-tokens/package.json`: the formatting is off (stray blank lines and a
dangling `,`). The `watch` script only watches `config.light.json`, so dark tokens go stale
during `watch`. `main: "index.js"` points at a file that doesn't exist (only the `exports`
map is used). Both `light.css` and `dark.css` are imported globally in `layout.tsx:2-3`,
which is correct for runtime theme switching. **S**

### 22. `predev` does network work on every `yarn dev`
`apps/web/package.json` `predev` rebuilds tokens, regenerates the architecture JSON, and
runs `sync-translations.mjs` (which calls Contentful) before every dev start. Offline, or
with a bad token, dev startup fails or slows down. **Fix:** make the translations sync fail
soft (keep the last generated file), or move it to `prebuild` only. **S**

---

## What is already good (keep it)
- `packages/ui` and `packages/utils` ship one subpath export per module with `sideEffects` set, so nothing barrel-loads.
- three.js, @xyflow/react, tsparticles, the CommandPalette, Terminal and ChatPanel are all behind `dynamic()`.
- Contentful fetches are tag-cached, and revalidation is wired through `/api/revalidate`.
- The quiz rules live in `packages/quiz` and are shared by the editor UI and the server: a good template for other shared plain-JS logic (see #10).

## Notes for parallel sessions
- **bundle-report:** please confirm or refute #3, #4 and #6 with real numbers. The quickest win is the shared layout chunk (framer-motion via `GamePrompt` + `NavLinks`).
- **worker-refactor:** the Worker imports `HTTP_STATUS` from `@dival-sehgal/utils/http`, and the quiz server keeps its own copy (#10). If you add a shared constants module, consider whether the quiz server can use it.
- **arch-widget:** `generated/architecture.json` is regenerated on every `predev`/`prebuild` (#22). If the widget reads it, a failing generator breaks dev startup.
