/**
 * Layered view of the web app for scripts/generate-architecture.mjs:
 * app shell → pages → feature modules → shared code → services.
 * Nodes and edges are read from the import graph under src/, so the diagram
 * follows the code: move a component and it changes layer.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";

const LAYER_LABELS = { shell: "App shell", pages: "Pages & routes", features: "Feature modules", shared: "Shared code & UI", services: "Services & APIs" };
export const LAYERS = Object.keys(LAYER_LABELS);
export const LAYER_LIST = LAYERS.map((id) => ({ id, label: LAYER_LABELS[id] }));

const SHELL_ROOTS = ["app/layout", "components/Providers"];
const nameOf = (key) => key.split("/").pop();
const list = (keys) => keys.map(nameOf).join(", ");
/** "@/components/Navbar/x" → "components/Navbar"; "@/lib/services/contentful" → "lib/services/contentful"; "@dival-sehgal/ui/button" → "@dival-sehgal/ui". */
const moduleOf = (spec) => (spec.startsWith("@/") ? spec.slice(2).split("/").slice(0, spec.startsWith("@/lib/services/") ? 3 : 2).join("/") : spec.split("/").slice(0, 2).join("/"));

/** Who imports whom under src/ (tests, mocks and generated files excluded). */
function importGraph(src, walk) {
  const toKey = (file) => relative(src, file).split(sep).join("/");
  const files = walk(src).filter((file) => /\.(tsx?|jsx?|mjs)$/.test(file) && !/\.test\.|(^|\/)(test-utils|test-mocks|generated)\//.test(toKey(file)));
  const cache = new Map();
  const importsOf = (file) => {
    if (!cache.has(file)) {
      const text = readFileSync(file, "utf8");
      const modules = new Set([...text.matchAll(/(?:from\s+|import\(\s*)["'](@\/[^"']+|@dival-sehgal\/[^"']+)["']/g)].map((match) => moduleOf(match[1])));
      cache.set(file, { modules, callsApi: /["'`]\/api\//.test(text) });
    }
    return cache.get(file);
  };
  return {
    files,
    toKey,
    importsOf,
    /** Files under a src-relative path: a directory, a file, or a file without its extension. */
    filesUnder: (path) => files.filter((file) => [toKey(file), toKey(file).replace(/\.\w+$/, "")].some((key) => key === path || key.startsWith(`${path}/`))),
    dirsIn: (path) =>
      existsSync(join(src, path))
        ? readdirSync(join(src, path), { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => `${path}/${entry.name}`).sort()
        : [],
    modulesOf: (fileList) => new Set(fileList.flatMap((file) => [...importsOf(file).modules])),
  };
}

/** 1. App shell: the root layout and what it (or its Providers) mounts on every page. */
function shellLayer(graph, add, versions) {
  const shellFiles = new Set(SHELL_ROOTS.flatMap(graph.filesUnder));
  const importedOutsideShell = (key) => graph.files.some((file) => !shellFiles.has(file) && !graph.toKey(file).startsWith(`${key}/`) && graph.importsOf(file).modules.has(key));
  // A component the shell mounts but pages also import (e.g. ViewTransition) is shared, not shell.
  const modules = [...graph.modulesOf([...shellFiles])]
    .filter((key) => /^(components|context)\//.test(key) && !SHELL_ROOTS.includes(key) && (key.startsWith("context/") || !importedOutsideShell(key)))
    .sort();
  const providers = modules.filter((key) => /^context\/|Provider|SiteIndex/.test(key));
  const chrome = modules.filter((key) => /Navbar|Footer/.test(key));
  const widgets = modules.filter((key) => !providers.includes(key) && !chrome.includes(key));
  const modalRoutes = graph.files
    .map(graph.toKey)
    .filter((key) => key.startsWith("app/@modal/") && key.endsWith("/page.tsx") && !key.includes("..."))
    .map((key) => "/" + dirname(key).replace(/^app\/@modal\/?/, "").replace(/\(\.\)/g, ""))
    .filter((route) => route !== "/")
    .sort();

  add("shell", { id: "root-layout", type: "frontend", label: "Root layout", owns: ["app/layout"], description: `app/layout.tsx (Next.js ${versions.next}, React ${versions.react}): <html>, metadata, theme bootstrap and analytics tags. Renders every page as {children} inside <main>, plus the {modal} slot.` });
  add("shell", { id: "shell-providers", type: "frontend", label: "Providers", owns: ["components/Providers", ...providers], description: `Context every page shares: ${list(["components/Providers", ...providers])}.` });
  const optional = [
    [chrome, { id: "shell-chrome", label: "Navbar & footer", owns: chrome, description: `Site chrome around each page: ${list(chrome)}.` }],
    [widgets, { id: "shell-widgets", label: "Global widgets", owns: widgets, description: `Mounted once for the whole site: ${list(widgets)}.` }],
    [modalRoutes, { id: "modal-slot", label: "Modal slot", owns: ["app/@modal"], description: `app/@modal shows ${modalRoutes.join(", ")} over the current page on in-app navigation.` }],
  ];
  optional.filter(([members]) => members.length).forEach(([, node]) => add("shell", { type: "frontend", ...node }));
  return modules;
}

/** 2. Pages: one node per page.tsx, owning only its own directory (nested routes are their own nodes). */
function pageLayer(graph, add) {
  const pages = graph.files.map(graph.toKey).filter((key) => /(^|\/)page\.tsx$/.test(key) && !/^app\/(@modal|api)\b/.test(key)).sort();
  for (const key of pages) {
    const dir = dirname(key);
    const files = graph.files.filter((file) => dirname(graph.toKey(file)) === dir && !/^layout\./.test(nameOf(graph.toKey(file))));
    add("pages", { id: `page:/${dir.replace(/^app\/?/, "")}`, type: "frontend", label: `/${dir.replace(/^app\/?/, "")}`, owns: [], files, description: key });
  }
}

/** 3. Feature modules: page-level containers and domain features. */
function featureLayer(graph, add, pages) {
  for (const key of [...graph.dirsIn("containers"), ...graph.dirsIn("features")]) {
    const users = pages.filter((page) => page.files.some((file) => graph.importsOf(file).modules.has(key))).map((page) => page.label);
    const role = key.startsWith("features/") ? "Domain module (data, schema, renderers)" : "Page body";
    add("features", { id: key, type: "backend", label: key, owns: [key], description: `${role}${users.length ? `, used by ${users.join(", ")}` : ""}.` });
  }
}

/** 4. Shared: components/ outside the shell (split by how many modules use them), workspace packages and helpers. */
function sharedLayer(graph, add, shellModules, owners) {
  const ownerOf = (file) => owners.find((node) => node.files.includes(file))?.id ?? moduleOf(`@/${graph.toKey(file)}`);
  const usersOf = (key) => new Set(graph.files.filter((file) => !graph.toKey(file).startsWith(`${key}/`) && graph.importsOf(file).modules.has(key)).map(ownerOf));
  const candidates = graph.dirsIn("components").filter((key) => !shellModules.includes(key) && !SHELL_ROOTS.includes(key));
  const multiUse = candidates.filter((key) => usersOf(key).size > 1);
  const singleUse = candidates.filter((key) => usersOf(key).size === 1);
  const packages = [...graph.modulesOf(graph.files)].filter((key) => key.startsWith("@dival-sehgal/")).sort();
  const helpers = ["hooks", "utils", "lib", "i18n", "actions"].filter((dir) => graph.dirsIn(".").includes(`./${dir}`));

  add("shared", { id: "shared-components", type: "frontend", label: "Shared components", owns: multiUse, description: `components/ used by more than one module (${multiUse.length}): ${list(multiUse)}.` });
  if (singleUse.length) {
    const pairs = singleUse.map((key) => `${nameOf(key)} → ${[...usersOf(key)][0]}`);
    add("shared", { id: "single-use-components", type: "frontend", label: "Single-use components", owns: singleUse, description: `components/ with one consumer each (${singleUse.length}), candidates to move next to it: ${pairs.join(", ")}.` });
  }
  if (packages.length) {
    add("shared", { id: "ui-packages", type: "frontend", label: "Workspace packages", owns: packages, files: [], description: `packages/ shared across apps: ${packages.join(", ")}.` });
  }
  add("shared", { id: "helpers", type: "backend", label: "Hooks, utils & lib", owns: [], files: [], description: `${helpers.map((dir) => `${dir}/`).join(", ")}: framework-free helpers, config, SEO and i18n.` });
}

/** 5. Services: API routes, the Worker and external systems, each only if the code uses it. */
function serviceLayer(add, { apiRoutes, integrations, wrangler, crons, chatModel, configRevalidate, revalidateRoute }) {
  const cronNote = crons.length ? `, re-indexed on a schedule (${crons.join(", ")})` : "";
  const bindings = [integrations.workersAi && "Workers AI", integrations.vectorize && "Vectorize", integrations.kv && "KV"].filter(Boolean);
  const services = [
    [true, { id: "api-routes", type: "backend", label: "API routes", owns: ["app/api"], description: `Next.js route handlers: ${apiRoutes.join(", ") || "none"}.` }],
    [integrations.worker, { id: "chatbot-worker", type: "backend", label: "AI Chatbot Worker", description: `Cloudflare Worker "${wrangler?.name}": retrieval-augmented chat${cronNote}. Uses ${bindings.join(", ") || "no bindings"}${chatModel ? ` and ${chatModel}` : ""}.` }],
    [integrations.contentful, { id: "contentful", type: "external", label: "Contentful CMS", owns: ["lib/services/contentful"], description: `Blog content over GraphQL${/revalidateTag/.test(revalidateRoute) ? "; a publish webhook busts the cache by tag" : ""}.` }],
    [integrations.portfolioConfig, { id: "portfolio-config", type: "data", label: "Portfolio Config", description: `JSON in a GitHub repo, validated with Zod${configRevalidate ? `, refreshed every ${configRevalidate}s` : ""}.` }],
    [integrations.notion, { id: "notion", type: "data", label: "Notion", owns: ["lib/services/notion"], description: "Contact submissions are stored as database rows." }],
    [integrations.redis, { id: "redis", type: "data", label: "Upstash Redis", owns: ["lib/redis"], description: "Blog view counts, visitor stats and rate limiting." }],
    [integrations.analytics, { id: "google-analytics", type: "external", label: "Google Analytics / GTM", description: "GA4 via gtag/GTM, client-side only; skipped in owner mode." }],
  ];
  // Only API routes have code of their own under src/ whose imports we follow.
  services.filter(([enabled]) => enabled).forEach(([, node]) => add("services", { owns: [], ...node, ...(node.id === "api-routes" ? {} : { files: [] }) }));
}

/** Import edges point down a layer; nearly everything uses the shared layer, so edges into it are left out. */
function buildEdges(graph, allNodes, integrations) {
  const ids = new Set(allNodes.map((node) => node.id));
  const edgeMap = new Map();
  const link = (source, target, label, extra = {}) => {
    const id = `e-${source}-${target}`;
    if (source !== target && ids.has(source) && ids.has(target) && !edgeMap.has(id)) {
      edgeMap.set(id, { id, source, target, ...(label ? { label } : {}), ...extra });
    }
  };
  allNodes.filter((node) => node.layer === "pages").forEach((page) => link("root-layout", page.id));
  for (const node of allNodes) {
    const modules = graph.modulesOf(node.files);
    const below = (other) => LAYERS.indexOf(other.layer) > LAYERS.indexOf(node.layer) && other.layer !== "shared";
    allNodes.filter((other) => below(other) && other.owns.some((key) => modules.has(key))).forEach((target) => link(node.id, target.id));
    if (node.id !== "api-routes" && node.files.some((file) => graph.importsOf(file).callsApi)) {
      link(node.id, "api-routes", "fetch /api");
    }
  }
  link("shell-widgets", "chatbot-worker", "chat", { animated: true });
  link("shell-widgets", "google-analytics", "page views");
  link("features/portfolio", "portfolio-config", "fetches JSON");
  if (integrations.workerSubmitsContact) {
    link("chatbot-worker", "api-routes", "submits contact", { curvature: 0.5 });
  }
  if (integrations.serverSeedsWorker) {
    link("api-routes", "chatbot-worker", "re-seed", { animated: true, curvature: -0.5 });
  }
  return [...edgeMap.values()];
}

const GAP_X = 250;
const ROW_Y = 190;

/** @returns {{ nodes: object[], edges: object[] }} one centred row per layer, plus the edges between them. */
export function buildLayers({ root, walk, versions, ...facts }) {
  const graph = importGraph(join(root, "src"), walk);
  const layers = Object.fromEntries(LAYERS.map((layer) => [layer, []]));
  /** owns: src-relative modules the node stands for (edges point at it when they're imported); files: where its own imports are read from. */
  const add = (layer, node) => layers[layer].push({ files: node.owns.flatMap(graph.filesUnder), ...node, layer });

  const shellModules = shellLayer(graph, add, versions);
  pageLayer(graph, add);
  featureLayer(graph, add, layers.pages);
  sharedLayer(graph, add, shellModules, [...layers.shell, ...layers.pages, ...layers.features]);
  serviceLayer(add, facts);

  const allNodes = LAYERS.flatMap((layer) => layers[layer]);
  const nodes = LAYERS.flatMap((layer, row) =>
    layers[layer].map((node, index, members) => ({
      id: node.id,
      type: node.type,
      tier: layer,
      position: { x: Math.round((index - (members.length - 1) / 2) * GAP_X), y: row * ROW_Y },
      data: { label: node.label, description: node.description },
    })),
  );
  return { nodes, edges: buildEdges(graph, allNodes, facts.integrations) };
}
