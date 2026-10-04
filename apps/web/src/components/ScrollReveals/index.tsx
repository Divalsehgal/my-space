"use client";

import { useEffect } from "react";
import { animate, inView } from "framer-motion";
import { EASE_OUT_EXPO, motionAllowed } from "@/lib/motion";
import { isInViewport } from "@dival-sehgal/utils/dom";

const BATCH_STEP = 0.06; // stagger between items that enter in the same frame
const REVEAL_OFFSET = "translateY(24px)";
const DURATION = 0.6;
// A scroll counts as a "jump" (anchor link, command palette, End key) when it
// moves most of a viewport in one event or travels faster than this.
const JUMP_VIEWPORT_RATIO = 0.75;
const JUMP_SPEED_PX_PER_MS = 4;
const JUMP_GRACE_MS = 300; // elements entering this soon after a jump just show

const show = (el: HTMLElement) => {
  el.style.opacity = "";
  el.style.transform = "";
};

/**
 * Page-level scroll choreography (render once per page):
 * - [data-split] headings wipe up from a mask as they enter.
 * - [data-reveal] blocks rise in; items entering together are staggered.
 * Anything already on screen at setup, or landed on via a jump, shows at once
 * so navigating to a section never lands on blank content.
 */
export default function ScrollReveals() {
  useEffect(() => {
    // inView is built on IntersectionObserver; without it, content just shows.
    if (!motionAllowed() || typeof IntersectionObserver === "undefined") {return;}
    const stops: (() => void)[] = [];

    // Detect big/fast scrolls so their targets skip the entrance animation.
    let lastY = window.scrollY;
    let lastT = performance.now();
    let jumpedAt = -Infinity;
    const onScroll = () => {
      const now = performance.now();
      const dy = Math.abs(window.scrollY - lastY);
      const dt = now - lastT;
      if (dy >= window.innerHeight * JUMP_VIEWPORT_RATIO || (dt > 0 && dy / dt > JUMP_SPEED_PX_PER_MS)) {
        jumpedAt = now;
      }
      lastY = window.scrollY;
      lastT = now;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const justJumped = () => performance.now() - jumpedAt < JUMP_GRACE_MS;

    // Items that enter in the same frame form a batch and are staggered.
    let batchIndex = 0;
    let batchFrame = 0;
    const nextDelay = () => {
      if (!batchFrame) {
        batchFrame = requestAnimationFrame(() => {
          batchIndex = 0;
          batchFrame = 0;
        });
      }
      return batchIndex++ * BATCH_STEP;
    };

    const once = (el: HTMLElement, onEnter: () => void, margin: `${number}px ${number}px ${number}% ${number}px`) => {
      const stop = inView(
        el,
        () => {
          if (justJumped()) {
            show(el);
          } else {
            onEnter();
          }
          stop();
        },
        { margin },
      );
      stops.push(stop);
    };

    // Only hide what is off screen; visible content is never blanked.
    const offscreen = (selector: string) =>
      Array.from(document.querySelectorAll<HTMLElement>(selector)).filter((el) => !isInViewport(el));

    offscreen("[data-split]").forEach((heading) => {
      heading.style.opacity = "0";
      once(
        heading,
        () =>
          animate(
            heading,
            {
              opacity: [0, 1],
              transform: ["translateY(0.45em)", "translateY(0)"],
              clipPath: ["inset(0 0 100% 0)", "inset(0 0 -25% 0)"],
            },
            { duration: DURATION, ease: EASE_OUT_EXPO },
          ),
        "0px 0px -12% 0px",
      );
    });

    offscreen("[data-reveal]").forEach((item) => {
      item.style.opacity = "0";
      item.style.transform = REVEAL_OFFSET;
      once(
        item,
        () =>
          animate(
            item,
            { opacity: [0, 1], transform: [REVEAL_OFFSET, "translateY(0)"] },
            { duration: DURATION, delay: nextDelay(), ease: EASE_OUT_EXPO },
          ),
        "0px 0px -10% 0px",
      );
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      stops.forEach((stop) => stop());
      if (batchFrame) {cancelAnimationFrame(batchFrame);}
    };
  }, []);

  return null;
}
