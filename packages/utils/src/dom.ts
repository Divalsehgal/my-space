/** True when the event target is somewhere the user types (so global shortcuts should not fire). */
export function isEditableTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

/** True when any part of the element is inside the viewport. */
export function isInViewport(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom > 0;
}

/** Non-hook media query check (SSR-safe: false on the server). Use `useMediaQuery` in render logic. */
export function matchesMedia(query: string): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(query).matches;
}
