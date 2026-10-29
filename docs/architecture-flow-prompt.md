# Prompt: auto-generated architecture flow widget (Vite + React Flow)

Paste below the line into your coding agent at the Vite project root.

---

Build an **architecture diagram generated from this codebase**, so it updates itself when the system changes, plus a small widget that opens it. It's for newcomers: what talks to what, and why. Stack: Vite + React + TS, `@xyflow/react` v12, `zod`. Match the existing code style.

**1. Generator: `scripts/generate-architecture.mjs`** (plain Node, no dependencies)
- Read facts from the code, never hard-code them: `package.json` versions, routes/pages, service files and SDK dependencies, `import.meta.env.VITE_*` usages, workspace packages and which apps depend on them (monorepo), infra config (`vite.config` proxies, vercel/wrangler/Docker). Missing files just mean the node is left out; don't crash.
- Nodes `{ id, type: frontend|backend|external|data, tier: client|compute|data, position, data: { label, description } }`. Add a node only if its fact is true. Each description is one sentence built from the real facts (versions, routes, bindings).
- Edges: a declarative `[source, target, label, { animated?, curvature? }]` list, filtered to nodes that exist. Two-way pairs get opposite `curvature` values (±0.5).
- Layout: no library. Each tier is a centred row: `x = (i - (n-1)/2) * 260`, `y = 0 / 200 / 400`.
- Write stable JSON to `src/generated/architecture.json` (committed). `--check` exits 1 if it's stale. Run it in `predev`/`prebuild`, and run `--check` in CI.

**2. Schema:** a Zod schema for `{ title, subtitle, nodes, edges }`. Parse the imported JSON once.

**3. Diagram (`ArchitectureDiagram`)**
- One custom node component for every type, with an icon chosen by type and styling via `data-type`. Target handle on top, source handle on the bottom.
- Edges use `MarkerType.ArrowClosed`. Pass the arrow colour from the theme in JS, because marker colour is inline and CSS can't override it.
- Read-only, and doesn't trap page scroll: no dragging or connecting, `zoomOnScroll`/`panOnScroll` off, `preventScrolling={false}`, pinch and drag allowed. `fitView` with `minZoom={0.15}` so wide graphs aren't clipped.
- Clicking a node opens a detail panel. Clicking the pane closes it.
- The canvas needs a fixed height.

**4. Loading and mobile**
- Load the diagram with `React.lazy`, mounted only when an IntersectionObserver fires and only at ≥768px.
- On phones, show stacked tiers instead: plain HTML `<details>` cards per tier listing each node's description and outgoing edges. No canvas.

**5. Widget:** a small card with a roughly six-dot SVG thumbnail (client → servers → data) and pulses travelling down the edges (`pathLength={1}` plus a staggered dash animation that respects reduced motion), a title and a ↗ arrow. Clicking it opens the diagram in an accessible modal or on an `/architecture` route.

**6. Tests:** generator output passes the schema, edge endpoints exist, ids are unique, and `--check` catches stale output. The diagram renders the nodes and clicking one shows its details (mock `ResizeObserver`). The tiers view groups nodes correctly.
