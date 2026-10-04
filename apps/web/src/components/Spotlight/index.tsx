"use client";

import { useEffect } from "react";
import { paintSpotlight } from "@/lib/spotlight";

/**
 * One delegated, frame-throttled pointer listener for every `[data-spotlight]`
 * card, so cards stay Server Components (no onPointerMove props). Mounted once
 * in the root layout; skipped on touch-only devices where there's no hover.
 */
export default function SpotlightTracker() {
  useEffect(() => {
    if (!window.matchMedia?.("(hover: hover)").matches) {return;}
    let frame = 0;
    let last: PointerEvent | null = null;
    const onMove = (event: PointerEvent) => {
      last = event;
      if (frame) {return;}
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (last) {paintSpotlight(last.target, last.clientX, last.clientY);}
      });
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}
