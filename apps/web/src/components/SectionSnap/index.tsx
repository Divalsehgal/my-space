"use client";

import { useEffect } from "react";
import Snap from "lenis/snap";
import { onLenis } from "@/lib/scroll";

/** A tall section's closing stop is skipped if it's this close to its top stop. */
const MIN_TAIL_PX = 40;
/** Stops closer together than this are merged. */
const MIN_STOP_GAP_PX = 160;
/** Quartic ease-out for snap scrolling. */
const EASE_OUT_POWER = 4;

const NAVBAR_OFFSET = 64; // keep each section's top clear of the fixed navbar
const DESKTOP_QUERY = "(min-width: 768px)";
const STEP = 0.85; // inner stops in tall sections overlap by 15% for context

/**
 * Section-by-section scrolling on the home page: each scroll gesture glides
 * the page to the next stop in that direction. Every section's top is a stop;
 * sections taller than the screen also get a stop every ~screenful down to
 * their end, so tall sections (Skills, Architecture) stay fully readable.
 * Tablet and desktop; phones keep native free scrolling.
 */
export default function SectionSnap() {
  useEffect(() => {
    if (typeof window.matchMedia !== "function" || !window.matchMedia(DESKTOP_QUERY).matches) {return;}

    let snap: Snap | null = null;
    let removers: (() => void)[] = [];
    let frame = 0;

    const placePoints = () => {
      if (!snap) {return;}
      removers.forEach((remove) => remove());
      const visible = window.innerHeight - NAVBAR_OFFSET;
      const stops = new Set<number>();
      document.querySelectorAll<HTMLElement>(".page-scroll > .section").forEach((section) => {
        const rect = section.getBoundingClientRect();
        const top = Math.max(0, Math.round(rect.top + window.scrollY - NAVBAR_OFFSET));
        stops.add(top);
        // Tall section: step through it, ending with its bottom flush to the screen.
        const lastStart = top + rect.height - visible;
        for (let y = top + visible * STEP; y < lastStart; y += visible * STEP) {stops.add(Math.round(y));}
        if (lastStart > top + MIN_TAIL_PX) {stops.add(Math.round(lastStart));}
      });
      // Merge stops closer than 160px (e.g. a tall section's end vs the next top).
      const merged = [...stops].sort((a, b) => a - b).filter((stop, i, all) => i === 0 || stop - all[i - 1] >= MIN_STOP_GAP_PX);
      removers = merged.map((stop) => snap!.add(stop));
    };
    // Section heights change as images, fonts and lazy content load.
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(placePoints);
    };
    const resizeObserver = new ResizeObserver(schedule);

    const unsubscribe = onLenis((lenis) => {
      snap?.destroy();
      snap = null;
      if (!lenis) {return;}
      snap = new Snap(lenis, {
        // "lock": every scroll gesture moves to the next stop in its direction
        // (a small nudge is enough), and input is ignored while gliding.
        type: "lock",
        duration: 0.9,
        // Any gesture reaches the next stop (stops are under a screen apart).
        distanceThreshold: "100%",
        easing: (t) => 1 - Math.pow(1 - t, EASE_OUT_POWER),
        debounce: 150,
      });
      placePoints();
    });
    resizeObserver.observe(document.body);

    return () => {
      unsubscribe();
      resizeObserver.disconnect();
      cancelAnimationFrame(frame);
      removers.forEach((remove) => remove());
      snap?.destroy();
    };
  }, []);

  return null;
}
