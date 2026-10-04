/**
 * Owner mode, client side.
 *
 * Signing in happens on the server at /owner (the secret never reaches the
 * browser). That sets two cookies: an httpOnly session the API routes verify,
 * and this harmless `owner_mode=1` flag, which client code reads only to skip
 * analytics and view counting for the owner. Faking the flag just opts a
 * visitor out of being counted; it grants nothing.
 */
const OWNER_FLAG_COOKIE = "owner_mode";
const LEGACY_FLAG = "owner_mode"; // localStorage flag from before /owner existed

/** True in a browser where the owner has signed in at /owner. */
export function isOwnerMode(): boolean {
  if (typeof document === "undefined") {return false;}
  if (document.cookie.split("; ").includes(`${OWNER_FLAG_COOKIE}=1`)) {return true;}
  try {
    return localStorage.getItem(LEGACY_FLAG) === "true";
  } catch {
    return false;
  }
}
