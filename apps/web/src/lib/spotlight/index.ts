/**
 * Pointer spotlight for `[data-spotlight]` cards (see the `spotlight-card`
 * mixin): writes the cursor position into --spot-x / --spot-y. CSS variables
 * only — no React state, no re-renders.
 *
 * Cards inside a `[data-spotlight-group]` light up together, so a border next
 * to the cursor glows even when the pointer is over the neighbouring card.
 */
export function paintSpotlight(target: EventTarget | null, clientX: number, clientY: number): void {
  if (!(target instanceof Element)) {return;}
  const group = target.closest<HTMLElement>("[data-spotlight-group]");
  const cards = group
    ? Array.from(group.querySelectorAll<HTMLElement>("[data-spotlight]"))
    : [target.closest<HTMLElement>("[data-spotlight]")].filter((el): el is HTMLElement => el !== null);
  for (const el of cards) {
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${clientX - rect.left}px`);
    el.style.setProperty("--spot-y", `${clientY - rect.top}px`);
  }
}
