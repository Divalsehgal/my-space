import { useEffect, type RefObject } from "react";

/** Scrolling down past this hides the navbar; any scroll past SCROLLED_AFTER_PX gives it a solid background. */
const HIDE_AFTER_PX = 240;
const SCROLLED_AFTER_PX = 8;

/**
 * Tucks the navbar away while scrolling down past the hero, brings it back on
 * scroll up, and exposes page progress as --scroll-scale. Class names are
 * passed in so the navbar keeps ownership of its stylesheet.
 */
export function useNavbarScroll(navRef: RefObject<HTMLElement | null>, classes: { hidden: string; scrolled: string }) {
  useEffect(() => {
    let ticking = false;
    let lastY = window.scrollY;
    const update = () => {
      const winScroll = window.scrollY || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const nav = navRef.current;
      if (nav) {
        nav.style.setProperty("--scroll-scale", String(height > 0 ? winScroll / height : 0));
        nav.classList.toggle(classes.hidden, winScroll > lastY && winScroll > HIDE_AFTER_PX);
        nav.classList.toggle(classes.scrolled, winScroll > SCROLLED_AFTER_PX);
      }
      lastY = winScroll;
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, [navRef, classes.hidden, classes.scrolled]);
}
