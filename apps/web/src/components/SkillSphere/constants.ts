/** Points nearer the viewer than this (0 = back, 1 = front) show their label. */
export const FRONT_CAP = 0.62;
export const SMALL_FRONT_CAP = 0.7;
/** Depth band over which a word cross-fades into its dot, instead of popping. */
export const LABEL_FADE = 0.08;

/** Motion tuning for the sphere (radians, pixels and 0-1 ratios). */
export const SPHERE = {
  glideEase: 0.08, // how fast a selected word glides to the front
  spinEase: 0.05, // how fast idle spin recovers after a drag
  tiltDamping: 0.92, // vertical momentum kept per frame
  maxTilt: 1.2, // radians the sphere may tip up or down
  radiusRatio: 0.42, // sphere radius as a share of the stage width
  smallRadius: 180, // below this (px) phones show fewer labels
  minScale: 0.7, // scale of a word at the very back
  scaleRange: 0.4, // extra scale gained moving to the front
  minOpacity: 0.3, // opacity at the very back
  styleDecimals: 3,
  dragThreshold: 3, // px of movement before a press counts as a drag
  dragSensitivity: 0.006, // radians per px dragged
} as const;

export const IDLE_SPEED = 0.0025; // radians per frame when nobody is interacting
