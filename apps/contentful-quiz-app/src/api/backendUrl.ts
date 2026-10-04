/** Quiz API base URL: VITE_BACKEND_URL in production; the Vite dev server proxies /api locally. */
export const backendUrl = (): string => import.meta.env.VITE_BACKEND_URL || "/api";
