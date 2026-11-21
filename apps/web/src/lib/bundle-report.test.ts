import { diff, formatDelta, moduleDeltas, routeDeltas, sharedChunks, sumChunks, type BundleSnapshot } from "./bundle-report";

const snapshot = (chunks: BundleSnapshot["chunks"], routes: BundleSnapshot["routes"]): BundleSnapshot => ({
  generatedAt: "2026-01-01T00:00:00.000Z",
  routes,
  chunks,
});

const before = snapshot(
  {
    "a.js": { raw: 1000, gzip: 400, modules: { "npm:next": 1000 } },
    "b.js": { raw: 500, gzip: 200, modules: { "src/home.tsx": 500 } },
  },
  [
    { route: "/", chunks: ["a.js", "b.js"] },
    { route: "/blogs", chunks: ["a.js"] },
  ],
);
// Chunk names change every build; deltas are keyed by route and module, never by chunk.
const after = snapshot(
  {
    "a2.js": { raw: 1000, gzip: 400, modules: { "npm:next": 1000 } },
    "b2.js": { raw: 4000, gzip: 1800, modules: { "src/home.tsx": 500, "npm:zod": 3500 } },
  },
  [
    { route: "/", chunks: ["a2.js", "b2.js"] },
    { route: "/new", chunks: ["a2.js", "b2.js"] },
  ],
);

describe("bundle report", () => {
  it("counts a chunk shared by several routes once", () => {
    expect(sumChunks(before, ["a.js", "b.js", "a.js"])).toEqual({
      raw: 1500,
      gzip: 600,
      modules: { "npm:next": 1000, "src/home.tsx": 500 },
    });
  });

  it("finds chunks every route loads", () => {
    expect(sharedChunks(before)).toEqual(["a.js"]);
  });

  it("flags route increases over the threshold and treats added/removed routes as 0 on the other side", () => {
    const byRoute = Object.fromEntries(routeDeltas({ current: after, baseline: before }).map((d) => [d.name, d]));
    expect(byRoute["/"]).toMatchObject({ size: 2200, previous: 600, delta: 1600, flagged: true });
    expect(byRoute["/new"]).toMatchObject({ previous: 0, delta: 2200, flagged: false });
    expect(byRoute["/blogs"]).toMatchObject({ size: 0, delta: -400, flagged: false });
  });

  it("reports a new dependency as a flagged module increase, largest change first", () => {
    const [first, ...rest] = moduleDeltas({ current: after, baseline: before });
    expect(first).toMatchObject({ name: "npm:zod", delta: 3500, flagged: true });
    expect(rest.every((d) => d.delta === 0)).toBe(true);
  });

  it("has no deltas without a baseline", () => {
    expect(diff({ x: 10 }, null, 1)).toEqual([{ name: "x", size: 10, previous: null, delta: 0, flagged: false }]);
  });

  it("never flags decreases", () => {
    expect(diff({ x: 0 }, { x: 5000 }, 1)[0]).toMatchObject({ delta: -5000, flagged: false });
  });

  it("formats signed deltas", () => {
    expect(formatDelta(2048)).toBe("+2.0 kB");
    expect(formatDelta(-300)).toBe("−300 B");
    expect(formatDelta(0)).toBe("±0");
  });
});
