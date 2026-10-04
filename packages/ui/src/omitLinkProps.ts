const LINK_ONLY = new Set(["href", "target", "rel", "download"]);

/** Drops anchor-only attributes so they never land on a <button>. */
export function omitLinkProps<T extends object>(props: T): T {
  return Object.fromEntries(Object.entries(props).filter(([key]) => !LINK_ONLY.has(key))) as T;
}
