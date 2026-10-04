"use client";

import { useEffect } from "react";
import { readTrackedClick, trackInteraction } from "@/utils/analytics";

/**
 * One delegated listener for every `trackAttrs(...)` element on the page, so
 * Server Components can declare analytics without shipping click handlers.
 * Mounted once in the root layout.
 */
export default function ClickTracker() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const tracked = readTrackedClick(event.target);
      if (tracked) {trackInteraction(tracked.eventName, tracked.payload);}
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}
