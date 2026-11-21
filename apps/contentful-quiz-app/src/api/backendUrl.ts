/** Quiz API base URL: VITE_BACKEND_URL (the deployed web app's /api) in production; Vite proxies /api to the local Next dev server. */
export const backendUrl = (): string => import.meta.env.VITE_BACKEND_URL || "/api";
