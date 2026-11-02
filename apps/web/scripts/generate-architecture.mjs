#!/usr/bin/env node
/**
 * Generates the home page's architecture diagram from the code itself, so the
 * diagram changes when the system does: add an integration, route, worker
 * binding or model and the next build shows it; remove one and it disappears.
 *
 * Also writes the chatbot's low-level design (src/generated/chatbot-lld.json),
 * read from the Worker source: its pipeline stages, thresholds and bindings.
 *
 *   node scripts/generate-architecture.mjs          write both JSON files
 *   node scripts/generate-architecture.mjs --check  exit 1 if a committed file is stale
 *
 * Runs automatically before `dev` and `build` (see package.json).
 */
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src/generated/architecture.json");
const LLD_OUT = join(ROOT, "src/generated/chatbot-lld.json");
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
  analytics: has("src/components/GoogleTracking/index.tsx"),
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
  const cronNote = crons.length ? `, re-indexed on a schedule (${crons.join(", ")})` : "";
  add("compute", {
    id: "chatbot-worker",
    type: "backend",
    label: "AI Chatbot Worker",
    description: `Cloudflare Worker "${wrangler.name}": retrieval-augmented chat${cronNote}.`,
  });
}
if (integrations.analytics) {
  add("compute", { id: "google-analytics", type: "external", label: "Google Analytics / GTM", description: "GA4 via gtag/GTM, client-side only; skipped in owner mode." });
}
if (integrations.contentful) {
  add("data", { id: "contentful", type: "external", label: "Contentful CMS", description: `Blog content over GraphQL${/revalidateTag/.test(revalidateRoute) ? "; a publish webhook busts the cache by tag" : ""}.` });
}
if (integrations.portfolioConfig) {
  const refreshNote = configRevalidate ? `, refreshed every ${configRevalidate}s` : "";
  add("data", { id: "portfolio-config", type: "data", label: "Portfolio Config", description: `JSON in a GitHub repo, validated with Zod${refreshNote}.` });
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
/** @type {Array<[source: string, target: string, label: string, extra?: Record<string, unknown>]>} */
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

// ---- Chatbot LLD ------------------------------------------------------------
/** Value of `const NAME = <literal>` in the Worker source, or the fallback. */
const constant = (name, fallback = "?") => workerSource.match(new RegExp(`const ${name} = ([^;]+);`))?.[1]?.trim() ?? fallback;
const rateLimit = wrangler?.ratelimits?.[0]?.simple;
const lldEnabled = integrations.worker && has("src/worker/stream.ts");

// Layout: React Flow edges leave a node's bottom and enter the next one's top,
// so every edge here points *down*. The chat request is one numbered column
// read top to bottom; data stores sit beside the step that uses them; the MCP
// and re-indexing flows are separate lanes on the right.
const lldNodes = [];
const STEP_Y = 100;
const LANE = { main: 0, data: 340, mcp: 680, seed: 1000 };
const lldNode = (tier, [id, type, label, description], [x, row]) =>
  lldNodes.push({ id, type, tier, position: { x, y: row * STEP_Y }, data: { label, description } });

if (lldEnabled) {
  const hasMcp = has("src/worker/mcp.ts");
  const steps = [
    ["chat-widget", "frontend", "Chat widget", "You type a question. The useChat hook POSTs { message, pagePath } to the Worker and shows the answer as it streams back (events: response = append text, replace = swap text, sources = links)."],
    ["input-guard", "backend", "Input guardrails", `Rejects empty or > ${constant("MAX_CHAT_MESSAGE_LENGTH")}-char messages, off-limits topics (whole words only) and prompt-extraction attempts. Rejected → fixed reply, no AI call.`],
    ["rate-limiter", "backend", "Rate limiter", rateLimit ? `At most ${rateLimit.limit} messages per ${rateLimit.period}s per IP (Cloudflare Rate Limiting binding).` : "Per-IP KV counter (best effort)."],
    ["session", "backend", "Session", `Reads the chatbot_session cookie and loads the conversation from KV (last ${constant("MAX_STORED_MESSAGES")} turns, 7 days). Malformed ids are ignored.`],
    ["retrieval", "backend", "Retrieval (RAG)", `Turns the question into an embedding and fetches the ${constant("DEFAULT_TOP_K")} most similar chunks from Vectorize (similarity ≥ ${constant("MIN_RELEVANCE_SCORE")}).`],
    ["scope-gate", "backend", "Scope gate", `Is this about Dival? Yes if it uses portfolio words, is a greeting or follow-up, or matched the index strongly (≥ ${constant("SEMANTIC_SCOPE_SCORE")}). No → polite refusal, no AI call.`],
    ["prompt", "backend", "Prompt builder", `Rules + a site index (all post/project titles from the KV catalog) + the retrieved chunks + the last ${constant("HISTORY_TURNS_SENT_TO_MODEL")} turns.`],
    ["llm-stream", "backend", "LLM (streaming)", `${chatModel ?? "chat model"} generates the answer token by token.`],
    ["output-guard", "backend", "Output guard", "Forwards each token to the browser as it arrives, hides the internal contact token, and swaps the reply if it starts leaking instructions."],
    ["contact-tool", "backend", "Contact tool", `Only when the user asked to message Dival and confirmed: validates name/email/message and sends it (max ${constant("MAX_CONTACTS_PER_SESSION")} per chat).`],
    ["contact-api", "backend", "/api/contact", "Next.js route shared with the site's contact form."],
  ];
  steps.forEach(([id, type, label, description], i) =>
    lldNode(i === 0 ? "client" : "compute", [id, type, id === "contact-api" ? label : `${i + 1}. ${label}`, description], [LANE.main, i]));

  lldNode("data", ["kv", "data", "Workers KV", "Chat sessions, the seed manifest (chunk id → hash) and the catalog (titles/links of posts, projects, roles, skills)."], [LANE.data, 4.5]);
  lldNode("data", ["vectorize", "data", "Vectorize", `Index "${wrangler.vectorize?.[0]?.index_name}": one vector per chunk of profile, experience, project, skills and blog text.`], [LANE.data, 5.5]);
  lldNode("data", ["workers-ai", "external", "Workers AI", `${chatModel} (answers) and ${embedModel} (embeddings).`], [LANE.data, 8.5]);

  if (hasMcp) {
    lldNode("client", ["mcp-client", "external", "MCP client", "An external AI agent (Claude Desktop, an IDE) connected to the Worker's /mcp URL."], [LANE.mcp, 0]);
    lldNode("compute", ["mcp-server", "backend", "MCP server (/mcp)", "Read-only tools: search_portfolio (same vector index), get_profile and list_blog_posts (KV catalog). Cannot send messages."], [LANE.mcp, 1.5]);
  }
  lldNode("compute", ["seeder", "backend", "Re-indexer", `Runs on deploy, on Contentful publish and daily (${crons.join(", ") || "no cron"}). Re-embeds only chunks whose content changed.`], [LANE.seed, 0]);
  lldNode("data", ["chat-context", "backend", "/api/chat-context", "Next.js route returning profile, experience, projects, skills and full blog text."], [LANE.seed, 1.5]);
}

const lldIds = new Set(lldNodes.map((node) => node.id));
const lldEdges = [
  ["chat-widget", "input-guard", "POST /api/chat", { animated: true }],
  ["input-guard", "rate-limiter"],
  ["rate-limiter", "session"],
  ["session", "retrieval"],
  ["retrieval", "scope-gate"],
  ["scope-gate", "prompt", "in scope"],
  ["prompt", "llm-stream"],
  ["llm-stream", "output-guard", "tokens", { animated: true }],
  ["output-guard", "contact-tool", "if confirmed"],
  ["contact-tool", "contact-api"],
  ["session", "kv", "load / save"],
  ["retrieval", "vectorize", "similar chunks"],
  ["llm-stream", "workers-ai", "generate"],
  ["mcp-client", "mcp-server", "JSON-RPC", { animated: true }],
  ["mcp-server", "kv", "catalog"],
  ["mcp-server", "vectorize", "search"],
  ["seeder", "chat-context", "fetch"],
  ["seeder", "kv", "catalog"],
  ["seeder", "vectorize", "upsert"],
]
  .filter(([source, target]) => lldIds.has(source) && lldIds.has(target))
  .map(([source, target, label, extra = {}]) => ({ id: `e-${source}-${target}`, source, target, ...(label ? { label } : {}), ...extra }));

const lldOutput = lldEnabled
  ? JSON.stringify({ title: "Chatbot LLD", subtitle: "Follow steps 1–10 top to bottom for one chat message. Middle column: where data lives. Right: the MCP endpoint and re-indexing. Click any box for details. Generated from the Worker code.", nodes: lldNodes, edges: lldEdges }, null, 2) + "\n"
  : JSON.stringify({ nodes: [], edges: [] }, null, 2) + "\n";

const outputs = [[OUT, output], [LLD_OUT, lldOutput]];
if (process.argv.includes("--check")) {
  const stale = outputs.filter(([file, content]) => (existsSync(file) ? readFileSync(file, "utf8") : "") !== content);
  if (stale.length) {
    console.error(`${stale.map(([file]) => relative(ROOT, file)).join(", ")} out of date. Run: node scripts/generate-architecture.mjs`);
    process.exit(1);
  }
  console.info("architecture diagrams are up to date.");
} else {
  mkdirSync(dirname(OUT), { recursive: true });
  for (const [file, content] of outputs) {
    writeFileSync(file, content);
  }
  console.info(`Wrote ${relative(ROOT, OUT)} (${nodes.length} nodes, ${edges.length} edges) and ${relative(ROOT, LLD_OUT)} (${lldNodes.length} nodes, ${lldEdges.length} edges).`);
}
