#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Bundle report. Run after `next build`:
 *
 *   yarn workspace web build && yarn workspace web report:sizes
 *
 * Reads the per-route first-load chunk list Next writes to
 * .next/diagnostics/route-bundle-stats.json, then walks each browser chunk's
 * source map (productionBrowserSourceMaps is on) to attribute its bytes to the
 * source files / npm packages inside it. Writes src/generated/bundle-report.json,
 * which the /bundle route renders.
 *
 * Baseline: the report committed at HEAD (git), falling back to the file on
 * disk. Commit the regenerated file to move the baseline forward; git history
 * is the size history.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { SourceMapConsumer } from "source-map-js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const NEXT = join(ROOT, ".next");
const STATS = join(NEXT, "diagnostics/route-bundle-stats.json");
const OUT = join(ROOT, "src/generated/bundle-report.json");
const OUT_REPO_PATH = "apps/web/src/generated/bundle-report.json";

/** Turns a Turbopack source URL into a stable module name: npm package, or repo path. */
export function moduleName(source) {
  const path = source
    .replace(/^turbopack:\/\/\/\[project\]\//, "")
    .replace(/ \[.*$/, "")
    .replace(/\?.*$/, "")
    .replace(/(node_modules\/)+/g, "node_modules/");
  const pkg = path.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/g)?.at(-1);
  if (pkg) {
    return `npm:${pkg.replace("node_modules/", "")}`;
  }
  return path.startsWith("turbopack:///") ? "(turbopack runtime)" : path;
}

/** Bytes of generated code attributed to each module name, scaled so they sum to `size`. */
function chunkModules(code, map, size) {
  const lines = code.split("\n");
  const chars = new Map();
  let prev;
  const add = (end) => {
    const name = prev.source ? moduleName(prev.source) : "(unmapped)";
    chars.set(name, (chars.get(name) ?? 0) + Math.max(0, end - prev.column));
  };
  new SourceMapConsumer(map).eachMapping((m) => {
    if (prev) {
      add(prev.line === m.generatedLine ? m.generatedColumn : (lines[prev.line - 1]?.length ?? 0));
    }
    prev = { line: m.generatedLine, column: m.generatedColumn, source: m.source };
  });
  if (prev) {
    add(lines[prev.line - 1]?.length ?? 0);
  }
  const mapped = [...chars.values()].reduce((a, b) => a + b, 0);
  if (code.length > mapped) {
    chars.set("(unmapped)", (chars.get("(unmapped)") ?? 0) + code.length - mapped);
  }
  // shortcut: source-map columns are UTF-16 units, scaled to bytes per chunk; exact enough for ASCII-heavy minified JS.
  const scale = size / code.length;
  return Object.fromEntries(
    [...chars].map(([name, n]) => [name, Math.round(n * scale)]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]),
  );
}

function readChunk(file) {
  const abs = join(ROOT, file);
  const buf = readFileSync(abs);
  const code = buf.toString("utf8");
  const mapRef = code.match(/\/\/# sourceMappingURL=(\S+)\s*$/)?.[1];
  const mapPath = mapRef && join(dirname(abs), mapRef);
  const modules = mapPath && existsSync(mapPath)
    ? chunkModules(code, JSON.parse(readFileSync(mapPath, "utf8")), buf.length)
    : { "(no source map)": buf.length };
  return { raw: buf.length, gzip: gzipSync(buf, { level: 9 }).length, modules };
}

function readBaseline() {
  try {
    return JSON.parse(execFileSync("git", ["show", `HEAD:${OUT_REPO_PATH}`], { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] })).current;
  } catch {
    // No git (e.g. Vercel's checkout) or not committed yet: use the file on disk.
    return existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")).current : null;
  }
}

function main() {
  if (!existsSync(STATS)) {
    console.error(`No ${STATS}. Run "yarn workspace web build" first.`);
    process.exit(1);
  }
  const stats = JSON.parse(readFileSync(STATS, "utf8"));
  const chunks = {};
  const routes = stats.map(({ route, firstLoadChunkPaths }) => {
    const files = firstLoadChunkPaths.map((p) => p.replace(/^\.next\/static\/chunks\//, ""));
    files.forEach((f) => {
      chunks[f] ??= readChunk(join(".next/static/chunks", f));
    });
    return { route, chunks: files };
  });

  const current = { generatedAt: new Date().toISOString(), routes, chunks };
  writeFileSync(OUT, `${JSON.stringify({ current, baseline: readBaseline() })}\n`);

  const kb = (n) => `${(n / 1024).toFixed(1)} kB`;
  console.log(`\n${"Route".padEnd(34)}${"First load (gzip)".padStart(20)}${"raw".padStart(12)}`);
  for (const { route, chunks: files } of routes) {
    const sum = (key) => files.reduce((total, f) => total + chunks[f][key], 0);
    console.log(`${route.padEnd(34)}${kb(sum("gzip")).padStart(20)}${kb(sum("raw")).padStart(12)}`);
  }
  console.log(`\nWrote ${OUT_REPO_PATH}. Deltas vs the committed baseline are on /bundle.\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
