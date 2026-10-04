import { useEffect, type RefObject } from "react";

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** Keeps Tab focus cycling inside `container`. */
function trapFocus(event: KeyboardEvent, container: HTMLElement | null) {
  const focusable = container?.querySelectorAll<HTMLElement>(FOCUSABLE);
  if (!focusable || focusable.length === 0) {return;}
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    last.focus();
    event.preventDefault();
  } else if (!event.shiftKey && document.activeElement === last) {
    first.focus();
    event.preventDefault();
  }
}

/**
 * While the mobile menu is open: lock page scroll, make the page behind it
 * inert, close on Escape and keep Tab focus inside the navbar.
 */
export function useMenuLock(open: boolean, close: () => void, navRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const main = document.getElementById("main-content");
    const unlock = () => {
      document.body.style.overflow = "";
      main?.removeAttribute("inert");
    };
    if (!open) {
      unlock();
      return;
    }
    document.body.style.overflow = "hidden";
    main?.setAttribute("inert", "true");
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      } else if (event.key === "Tab") {
        trapFocus(event, navRef.current);
      }
    };
    globalThis.addEventListener("keydown", onKeyDown);
    return () => {
      globalThis.removeEventListener("keydown", onKeyDown);
      unlock();
    };
  }, [open, close, navRef]);
}
