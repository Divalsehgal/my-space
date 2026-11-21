/** Owner-mode cookie names. Kept apart from ./index (server-only) so client code can share them. */
export const OWNER_SESSION_COOKIE = "owner_session";
/** Non-sensitive, JS-readable hint so client code can skip analytics for the owner. */
export const OWNER_FLAG_COOKIE = "owner_mode";
