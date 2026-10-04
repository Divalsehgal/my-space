/** Shared easing for entrances: fast start, long soft settle ("expo out"). */
// eslint-disable-next-line @typescript-eslint/no-magic-numbers -- cubic-bezier control points are the data itself
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/** False for reduced-motion users and in non-browser/test environments. */
export function motionAllowed() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
