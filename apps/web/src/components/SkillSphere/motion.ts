import { shortestAngle } from "@dival-sehgal/utils/math";
import { IDLE_SPEED, SPHERE } from "./constants";
import type { SphereMotion } from "./useSphereDrag";

/** The tuning constants are per 60fps frame; elapsed time is converted to that unit. */
const FRAME_MS = 16.667; // one frame at 60fps
/** After a long stall (tab switch, GC pause) step at most this many frames, so nothing jumps. */
const MAX_FRAMES_PER_STEP = 3;

/**
 * Advance the sphere by `elapsedMs`, frame-rate independent: the same spin on
 * 60Hz and 120Hz screens, and a dropped frame catches up instead of hitching.
 */
export function stepMotion(s: SphereMotion, animate: boolean, elapsedMs: number) {
  const frames = Math.min(elapsedMs / FRAME_MS, MAX_FRAMES_PER_STEP);
  // Exponential easing compounded over the elapsed frames.
  const ease = (perFrame: number) => 1 - (1 - perFrame) ** frames;
  if (s.target) {
    // Glide the chosen word to the front (or jump there without motion).
    const glide = animate ? ease(SPHERE.glideEase) : 1;
    s.rotY += shortestAngle(s.rotY, s.target.y) * glide;
    s.rotX += (s.target.x - s.rotX) * glide;
    s.velY = 0;
    s.velX = 0;
  } else if (animate && !s.dragging) {
    const target = s.hovering ? 0 : IDLE_SPEED;
    s.velY += (target - s.velY) * ease(SPHERE.spinEase);
    s.velX *= SPHERE.tiltDamping ** frames;
  }
  s.rotY += s.velY * frames;
  s.rotX = Math.max(-SPHERE.maxTilt, Math.min(SPHERE.maxTilt, s.rotX + s.velX * frames));
}
