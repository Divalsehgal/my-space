/** Tiny event bus so the palette and terminal can drive widgets they don't own. */
export const SITE_EVENTS = {
  openGame: "site:open-game",
  openChat: "site:open-chat",
  openPalette: "site:open-palette",
  openTerminal: "site:open-terminal",
} as const;

export function emitSiteEvent(name: (typeof SITE_EVENTS)[keyof typeof SITE_EVENTS], detail?: unknown) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}
