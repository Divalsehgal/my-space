// Freezes page scrolling behind modals (game prompt, command center, route
// modals). Call only while the modal is open; always pair with unlockScroll.
export function lockScroll() {
  document.documentElement.style.overflow = "hidden";
}

export function unlockScroll() {
  document.documentElement.style.overflow = "";
}
