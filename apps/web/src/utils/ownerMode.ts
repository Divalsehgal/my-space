/**
 * Owner Mode Utility
 *
 * Lets the site owner (you) opt out of:
 *   1. Google Analytics / GTM tracking
 *   2. Upstash Redis view count increments
 *
 * Works on two levels:
 *   - **Client-side**: localStorage flag prevents the view POST from firing.
 *   - **Server-side**: A cookie (`admin_view_secret`) is sent with every request.
 *     The API route checks this cookie and skips recording even if the client-side
 *     check is bypassed (e.g. incognito window, curl, different browser).
 *
 * How to activate in the browser console:
 *   enableOwnerMode()   // imported, or:
 *   localStorage.setItem('owner_mode', 'true'); location.reload();
 *
 * How to deactivate:
 *   disableOwnerMode()  // imported, or:
 *   localStorage.removeItem('owner_mode'); location.reload();
 */

const OWNER_FLAG = 'owner_mode';
const OWNER_COOKIE_NAME = 'admin_view_secret';

/**
 * Returns the ADMIN_VIEW_SECRET value to use for the cookie.
 * Falls back to a hardcoded sentinel if the env var is not available client-side.
 * The server checks against process.env.ADMIN_VIEW_SECRET.
 */
function getOwnerSecret(): string {
  // NEXT_PUBLIC_ prefix makes this available client-side
  return process.env.NEXT_PUBLIC_ADMIN_VIEW_SECRET || '__owner__';
}

/** Returns true if running in a browser and owner mode is active. */
export function isOwnerMode(): boolean {
  if (typeof window === 'undefined') {return false;}
  try {
    return localStorage.getItem(OWNER_FLAG) === 'true';
  } catch {
    return false;
  }
}

/**
 * Sets a cookie that the server can read to identify the owner.
 * Uses document.cookie since this runs client-side.
 */
function setOwnerCookie(): void {
  const secret = getOwnerSecret();
  // 1 year expiry, same as the visitor_id cookie
  const maxAge = 60 * 60 * 24 * 365;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${OWNER_COOKIE_NAME}=${encodeURIComponent(secret)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

/**
 * Removes the owner cookie.
 */
function clearOwnerCookie(): void {
  document.cookie = `${OWNER_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

/** Activates owner mode and reloads the page. */
export function enableOwnerMode(): void {
  if (typeof window === 'undefined') {return;}
  try {
    localStorage.setItem(OWNER_FLAG, 'true');
    setOwnerCookie();
    window.location.reload();
  } catch {
    // ignore
  }
}

/** Deactivates owner mode and reloads the page. */
export function disableOwnerMode(): void {
  if (typeof window === 'undefined') {return;}
  try {
    localStorage.removeItem(OWNER_FLAG);
    clearOwnerCookie();
    window.location.reload();
  } catch {
    // ignore
  }
}
