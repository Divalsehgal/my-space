/** Shape written by scripts/report-sizes.mjs to src/generated/bundle-report.json. */
export type BundleChunk = { raw: number; gzip: number; modules: Record<string, number> };
export type BundleSnapshot = {
  generatedAt: string;
  routes: { route: string; chunks: string[] }[];
  chunks: Record<string, BundleChunk>;
};
export type BundleReport = { current: BundleSnapshot; baseline: BundleSnapshot | null };

export type Sizes = { raw: number; gzip: number; modules: Record<string, number> };
export type Delta = { name: string; size: number; previous: number | null; delta: number; flagged: boolean };

/** Increases at or above these are flagged as possible regressions. */
export const ROUTE_THRESHOLD_GZIP = 1024;
export const MODULE_THRESHOLD_RAW = 2048;

/** Totals and per-module bytes for a set of chunks, each chunk counted once. */
export function sumChunks(snapshot: BundleSnapshot, files: Iterable<string>): Sizes {
  const sizes: Sizes = { raw: 0, gzip: 0, modules: {} };
  for (const file of new Set(files)) {
    const chunk = snapshot.chunks[file];
    if (!chunk) {
      continue;
    }
    sizes.raw += chunk.raw;
    sizes.gzip += chunk.gzip;
    for (const [name, bytes] of Object.entries(chunk.modules)) {
      sizes.modules[name] = (sizes.modules[name] ?? 0) + bytes;
    }
  }
  return sizes;
}

/** Chunks every route loads (the framework + root layout bundle). */
export function sharedChunks(snapshot: BundleSnapshot): string[] {
  const [first, ...rest] = snapshot.routes;
  return first ? first.chunks.filter((c) => rest.every((r) => r.chunks.includes(c))) : [];
}

/** First-load totals per route. */
export function routeSizes(snapshot: BundleSnapshot): Map<string, Sizes> {
  return new Map(snapshot.routes.map((r) => [r.route, sumChunks(snapshot, r.chunks)]));
}

/** Every module in any route's first load, each chunk counted once. */
export function allModules(snapshot: BundleSnapshot): Record<string, number> {
  return sumChunks(snapshot, snapshot.routes.flatMap((r) => r.chunks)).modules;
}

/**
 * Current vs previous values by name. A name missing on one side counts as 0 there
 * (new or removed); `previous` is null when there is no baseline at all.
 * Sorted by largest absolute change first.
 */
export function diff(
  current: Record<string, number>,
  previous: Record<string, number> | null,
  threshold: number,
): Delta[] {
  const names = new Set([...Object.keys(current), ...Object.keys(previous ?? {})]);
  return [...names]
    .map((name) => {
      const size = current[name] ?? 0;
      const before = previous ? (previous[name] ?? 0) : null;
      const delta = before === null ? 0 : size - before;
      return { name, size, previous: before, delta, flagged: delta >= threshold };
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || b.size - a.size);
}

export function routeDeltas(report: BundleReport): Delta[] {
  const gzipOf = (s: BundleSnapshot) => Object.fromEntries([...routeSizes(s)].map(([route, sz]) => [route, sz.gzip]));
  // A new route has no size to regress from, so it is reported but not flagged.
  return diff(gzipOf(report.current), report.baseline && gzipOf(report.baseline), ROUTE_THRESHOLD_GZIP).map((d) =>
    d.previous === 0 ? { ...d, flagged: false } : d,
  );
}

export function moduleDeltas(report: BundleReport): Delta[] {
  return diff(allModules(report.current), report.baseline && allModules(report.baseline), MODULE_THRESHOLD_RAW);
}

const KB = 1024;

export function formatBytes(bytes: number): string {
  return Math.abs(bytes) < KB ? `${bytes} B` : `${(bytes / KB).toFixed(1)} kB`;
}

export function formatDelta(delta: number): string {
  return delta === 0 ? "±0" : `${delta > 0 ? "+" : "−"}${formatBytes(Math.abs(delta))}`;
}
