/** Stack game tuning: sizes, physics, colours, camera and lights (world units and seconds). */
export type Block = { id: number; x: number; z: number; w: number; d: number; y: number; color: string };
export type Physics = { y: number; vy: number; spin: number };

export const BLOCK_HEIGHT = 0.42;
export const BASE_SIZE = 3;
export const RANGE = 4.4; // how far the moving block travels either side
export const PERFECT = 0.12; // offset that still counts as a perfect drop
export const GRAVITY = 22;
export const VISIBLE_BLOCKS = 30;

export const FULL_TURN_DEGREES = 360;
/** Slowest frame rate simulated in one step, so a background tab doesn't teleport blocks. */
export const MIN_SIMULATED_FPS = 30;
export const MAX_FRAME_SECONDS = 1 / MIN_SIMULATED_FPS;

/** Block colours: an indigo base drifting toward warm hues as the tower grows. */
export const COLOR = { baseHue: 232, hueStep: 8, saturation: 46, baseLightness: 34, lightness: 62 } as const;
/** Moving-block speed (units/s): starts slow, speeds up per block, capped. */
export const SPEED = { start: 3, perBlock: 0.14, max: 8 } as const;
/** Offcuts: extra spin on the second axis, and how far they fall before removal. */
export const DEBRIS = { secondarySpin: 0.6, fallDistance: 14, spinScale: 4, spinBuckets: 11, spinPrime: 37 } as const;
/** Demo tower shown before the first game: per-layer offsets and shrink. */
// eslint-disable-next-line @typescript-eslint/no-magic-numbers -- hand-tuned layer offsets (a data table)
export const DEMO = { shifts: [0, 0.18, -0.12, 0.08, -0.05, 0.1], widthStep: 0.22, depthStep: 0.16 } as const;
/** Isometric camera: distance on each axis, follow speed, framing and zoom fit. */
export const CAMERA = { distance: 7, followRate: 3, lookBelowTop: 0.9, viewUnits: 8.5, zoomEpsilon: 0.01 } as const;
/** Device-pixel-ratio cap: sharp on retina without rendering 3x on phones. */
export const MAX_DPR = 1.75;
export const CAMERA_START = { zoom: 50, near: 0.1, far: 200 } as const;
export const KEY_LIGHT = { x: 6, y: 12, z: 4, intensity: 1.8 } as const;
export const FILL_LIGHT = { x: -6, y: 4, z: -6, intensity: 0.5, color: "#ffb47a" } as const;
export const AMBIENT_LIGHT = 0.9;

/** Deterministic tumble per piece (no RNG needed for a visual wobble): -spinScale/2…spinScale/2. */
export const debrisSpin = (id: number) =>
  (((id * DEBRIS.spinPrime) % DEBRIS.spinBuckets) / (DEBRIS.spinBuckets - 1) - 1 / 2) * DEBRIS.spinScale;

// Indigo base drifting toward warm hues as the tower grows (brand range).
export const colorFor = (index: number) =>
  `hsl(${(COLOR.baseHue + index * COLOR.hueStep) % FULL_TURN_DEGREES}, ${COLOR.saturation}%, ${index === 0 ? COLOR.baseLightness : COLOR.lightness}%)`;

export const BASE_BLOCK: Block = { id: 0, x: 0, z: 0, w: BASE_SIZE, d: BASE_SIZE, y: 0, color: colorFor(0) };

// A small finished tower shown before the first game, so the panel isn't empty.
export const DEMO_TOWER: Block[] = [
  BASE_BLOCK,
  ...DEMO.shifts.map((shift, i) => ({
    id: -(i + 1),
    x: shift,
    z: -shift / 2,
    w: BASE_SIZE - i * DEMO.widthStep,
    d: BASE_SIZE - i * DEMO.depthStep,
    y: (i + 1) * BLOCK_HEIGHT,
    color: colorFor(i + 1),
  })),
];
