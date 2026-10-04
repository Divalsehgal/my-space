import type Lenis from "lenis";

// The site-wide Lenis instance (registered by components/SmoothScroll), so
// overlays like the game modal can pause page scrolling behind them, and page
// features like section snapping can attach to it.
let lenis: Lenis | null = null;
const listeners = new Set<(instance: Lenis | null) => void>();

export function registerLenis(instance: Lenis | null) {
  lenis = instance;
  listeners.forEach((listener) => listener(instance));
}

/**
 * Calls back with the Lenis instance now (if ready) and whenever it changes.
 * Returns an unsubscribe function.
 */
export function onLenis(listener: (instance: Lenis | null) => void) {
  listeners.add(listener);
  if (lenis) {listener(lenis);}
  return () => {
    listeners.delete(listener);
  };
}

export function lockScroll() {
  lenis?.stop();
  document.documentElement.style.overflow = "hidden";
}

export function unlockScroll() {
  document.documentElement.style.overflow = "";
  lenis?.start();
}
