import { FRONT_CAP, LABEL_FADE, SMALL_FRONT_CAP, SPHERE } from "./constants";
import type { Point } from "./types";
import type { SphereMotion } from "./useSphereDrag";

/** z-index range across the sphere's depth (0 = back). */
const Z_RANGE = 100;
/** A word is "back" (no pointer events) once it's more dot than label. */
const LABEL_MIDPOINT = 0.5;

/** The DOM a frame draws into, plus a z-index cache so it's only written on change. */
export type SphereScene = {
  points: Point[];
  nodes: (HTMLLIElement | null)[];
  lastZ: number[];
  backClass: string;
};

/**
 * Project every point at the current rotation and write it to its node.
 * Drawing only: it never advances the motion.
 */
export function drawSphere(s: SphereMotion, { points, nodes, lastZ, backClass }: SphereScene, radius: number) {
  // Phones get a smaller cap of labels so edge words don't collide.
  const cap = radius < SPHERE.smallRadius ? SMALL_FRONT_CAP : FRONT_CAP;
  const cy = Math.cos(s.rotY), sy = Math.sin(s.rotY), cx = Math.cos(s.rotX), sx = Math.sin(s.rotX);
  points.forEach((p, i) => {
    const node = nodes[i];
    if (!node) {return;}
    const x1 = p.x * cy + p.z * sy;
    const z1 = -p.x * sy + p.z * cy;
    const y2 = p.y * cx - z1 * sx;
    const z2 = p.y * sx + z1 * cx;
    const depth = (z2 + 1) / 2; // 0 = back, 1 = front
    // Sub-pixel precision: 0.1px rounding made the slow idle spin step unevenly.
    node.style.transform = `translate(-50%, -50%) translate3d(${(x1 * radius).toFixed(2)}px, ${(y2 * radius).toFixed(2)}px, 0) scale(${(SPHERE.minScale + depth * SPHERE.scaleRange).toFixed(SPHERE.styleDecimals)})`;
    node.style.opacity = (SPHERE.minOpacity + depth * (1 - SPHERE.minOpacity)).toFixed(2);
    const z = Math.round(depth * Z_RANGE);
    if (lastZ[i] !== z) {
      node.style.zIndex = String(z);
      lastZ[i] = z;
    }
    // Only the front cap shows words; further back each word cross-fades into
    // its dot, so readable labels never print over each other. Only opacity
    // changes: the box keeps the word's size, so nothing reflows.
    const label = Math.min(1, Math.max(0, (depth - cap) / LABEL_FADE + LABEL_MIDPOINT));
    const [dot, word] = node.children as unknown as HTMLElement[];
    word.style.opacity = label.toFixed(2);
    dot.style.opacity = (1 - label).toFixed(2);
    // A literal class (not a data attribute) so PurgeCSS keeps the rule.
    const back = label < LABEL_MIDPOINT;
    if (node.classList.contains(backClass) !== back) {node.classList.toggle(backClass, back);}
  });
}
