/** π(3 − √5) rad (≈137.5°): the turn between points that spaces them most evenly. */
const GOLDEN_ANGLE = 2.399963229728653;
/** Sample each latitude band at its middle, not its edge. */
const BAND_CENTRE = 0.5;

/** Signed shortest rotation from one angle to another, in radians (−π…π). */
export function shortestAngle(from: number, to: number): number {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

/** `count` evenly spread points on a unit sphere (Fibonacci lattice), top to bottom. */
export function fibonacciSphere(count: number): { x: number; y: number; z: number }[] {
  return Array.from({ length: count }, (_, i) => {
    const y = 1 - ((i + BAND_CENTRE) / count) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = GOLDEN_ANGLE * i;
    return { x: Math.cos(theta) * radius, y, z: Math.sin(theta) * radius };
  });
}
