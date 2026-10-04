#!/usr/bin/env node
/**
 * Generates the home page's architecture diagram from the code itself, so the
 * diagram changes when the system does: add an integration, route, worker
 * binding or model and the next build shows it; remove one and it disappears.
 *
 *   node scripts/generate-architecture.mjs          write src/generated/architecture.json
 *   node scripts/generate-architecture.mjs --check  exit 1 if the committed file is stale
 *
 * Runs automatically before `dev` and `build` (see package.json).
 */
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src/generated/architecture.json");
const read = (path) => (existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), "utf8") : "");
const has = (path) => existsSync(join(ROOT, path));

function walk(dir) {
  if (!existsSync(dir)) {return [];}
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
  );
}

// ---- Facts read from the codebase -------------------------------------------
const pkg = JSON.parse(read("package.json"));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };
const version = (name) => (deps[name] ?? "").replace(/^[\^~]/, "");

const apiRoutes = walk(join(ROOT, "src/app/api"))
  .filter((file) => /route\.(ts|js)$/.test(file))
  .map((file) => "/" + relative(join(ROOT, "src/app"), dirname(file)).split(sep).join("/"))
  .sort();

const wrangler = has("wrangler.json") ? JSON.parse(read("wrangler.json")) : null;
const workerSource = walk(join(ROOT, "src/worker"))
  .filter((file) => /\.(ts|js)$/.test(file) && !/\.test\./.test(file))
  .map((file) => readFileSync(file, "utf8"))
  .join("\n");
const models = [...new Set(workerSource.match(/@cf\/[\w./-]+/g) ?? [])];
const chatModel = models.find((model) => !/bge|embed/i.test(model));
const embedModel = models.find((model) => /bge|embed/i.test(model));
const crons = wrangler?.triggers?.crons ?? [];

const portfolioService = read("src/features/portfolio/portfolio.service.ts");
const configRevalidate = portfolioService.match(/revalidate:\s*(\d+)/)?.[1];
const revalidateRoute = read("src/app/api/revalidate/route.ts");

const integrations = {
  contentful: has("src/lib/services/contentful.ts"),
  portfolioConfig: /raw\.githubusercontent\.com/.test(portfolioService),
  notion: has("src/lib/services/notion.ts"),
  redis: Boolean(deps["@upstash/redis"]),
  analytics: has("src/components/GoogleTracking.tsx"),
  worker: Boolean(wrangler),
  workersAi: Boolean(wrangler?.ai),
  vectorize: (wrangler?.vectorize ?? []).length > 0,
  kv: (wrangler?.kv_namespaces ?? []).length > 0,
  workerSubmitsContact: /api\/contact/.test(workerSource),
  serverSeedsWorker: /SEED_SECRET/.test(revalidateRoute),
};

// ---- Nodes ------------------------------------------------------------------
const tiers = { client: [], compute: [], data: [] };
const add = (tier, node) => tiers[tier].push(node);

add("client", {
  id: "browser",
  type: "frontend",
  label: "Browser (Client)",
  description: `React ${version("react")} client components: navigation, contact form, games and the chat widget${integrations.worker ? ", which calls the chatbot worker directly" : ""}.`,
});
add("compute", {
  id: "nextjs-server",
  type: "backend",
  label: `Next.js ${version("next")}`,
  description: `App Router with Server Components and Server Actions. API routes: ${apiRoutes.join(", ") || "none"}.`,
});
if (integrations.worker) {
  add("compute", {
    id: "chatbot-worker",
    type: "backend",
    label: "AI Chatbot Worker",
    description: `Cloudflare Worker "${wrangler.name}": retrieval-augmented chat${crons.length ? `, re-indexed on a schedule (${crons.join(", ")})` : ""}.`,
  });
}
if (integrations.analytics) {
  add("compute", { id: "google-analytics", type: "external", label: "Google Analytics / GTM", description: "GA4 via gtag/GTM, client-side only; skipped in owner mode." });
}
if (integrations.contentful) {
  add("data", { id: "contentful", type: "external", label: "Contentful CMS", description: `Blog content over GraphQL${/revalidateTag/.test(revalidateRoute) ? "; a publish webhook busts the cache by tag" : ""}.` });
}
if (integrations.portfolioConfig) {
  add("data", { id: "portfolio-config", type: "data", label: "Portfolio Config", description: `JSON in a GitHub repo, validated with Zod${configRevalidate ? `, refreshed every ${configRevalidate}s` : ""}.` });
}
if (integrations.notion) {
  add("data", { id: "notion", type: "data", label: "Notion", description: "Contact submissions are stored as database rows." });
}
if (integrations.redis) {
  add("data", { id: "redis", type: "data", label: "Upstash Redis", description: "Blog view counts, visitor stats and rate limiting." });
}
if (integrations.workersAi) {
  add("data", { id: "workers-ai", type: "external", label: "Workers AI", description: `Hosted models: ${[chatModel, embedModel].filter(Boolean).join(" (chat), ").replace(/$/, embedModel ? " (embeddings)" : "")}.` });
}
if (integrations.vectorize) {
  add("data", { id: "vectorize", type: "data", label: "Vectorize Index", description: `Embeddings index "${wrangler.vectorize[0].index_name}" used for retrieval.` });
}
if (integrations.kv) {
  add("data", { id: "chat-sessions-kv", type: "data", label: "Workers KV", description: `Namespaces: ${wrangler.kv_namespaces.map((kv) => kv.binding).join(", ")} (chat sessions, rate limits).` });
}

// ---- Edges ------------------------------------------------------------------
const ids = new Set(Object.values(tiers).flat().map((node) => node.id));
const edgeList = [
  ["browser", "nextjs-server", "contact + view requests"],
  ["browser", "chatbot-worker", "chat queries", { animated: true }],
  ["browser", "google-analytics", "page views"],
  ["nextjs-server", "contentful", "GraphQL query"],
  ["nextjs-server", "portfolio-config", "fetches JSON"],
  ["nextjs-server", "notion", "creates entry"],
  ["nextjs-server", "redis", "views + rate limit"],
  ["chatbot-worker", "workers-ai", "LLM + embeddings"],
  ["chatbot-worker", "vectorize", "RAG lookup"],
  ["chatbot-worker", "chat-sessions-kv", "sessions"],
  ...(integrations.workerSubmitsContact ? [["chatbot-worker", "nextjs-server", "submits contact", { curvature: 0.5 }]] : []),
  ...(integrations.serverSeedsWorker ? [["nextjs-server", "chatbot-worker", "", { animated: true, curvature: -0.5 }]] : []),
];
const edges = edgeList
  .filter(([source, target]) => ids.has(source) && ids.has(target))
  .map(([source, target, label, extra = {}]) => ({ id: `e-${source}-${target}`, source, target, ...(label ? { label } : {}), ...extra }));

// ---- Layout: three tiers, centred rows ---------------------------------------
const GAP_X = 260;
const TIER_Y = { client: 0, compute: 200, data: 400 };
const nodes = Object.entries(tiers).flatMap(([tier, list]) =>
  list.map((node, index) => ({
    id: node.id,
    type: node.type,
    tier,
    position: { x: Math.round((index - (list.length - 1) / 2) * GAP_X), y: TIER_Y[tier] },
    data: { label: node.label, description: node.description },
  })),
);

const output = JSON.stringify({ title: "Architecture", subtitle: "Generated from this site's own code on every build.", nodes, edges }, null, 2) + "\n";

if (process.argv.includes("--check")) {
  const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  if (current !== output) {
    console.error("architecture.json is out of date. Run: node scripts/generate-architecture.mjs");
    process.exit(1);
  }
  console.info("architecture.json is up to date.");
} else {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, output);
  console.info(`Wrote ${relative(ROOT, OUT)}: ${nodes.length} nodes, ${edges.length} edges.`);
}
