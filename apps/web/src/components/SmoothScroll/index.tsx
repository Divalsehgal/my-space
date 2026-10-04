"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { motionAllowed } from "@/lib/motion";
import { registerLenis } from "@/lib/scroll";

/**
 * Inertia smooth scrolling for the whole site, driven by Lenis's own
 * requestAnimationFrame loop. Reduced-motion users keep native scrolling.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (!motionAllowed()) {return;}

    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.09,
      wheelMultiplier: 0.9,
      anchors: { offset: -64 }, // clears the fixed navbar
    });
    registerLenis(lenis);

    return () => {
      registerLenis(null);
      lenis.destroy();
    };
  }, []);

  return null;
}
