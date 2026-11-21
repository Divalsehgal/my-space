import { backendUrl } from './backendUrl';

/** A request to sign; see Contentful's App SDK `cma.appSignedRequest.create`. */
export interface SignableRequest {
  method: 'POST';
  path: string;
  headers: Record<string, string>;
  body: string;
}

/** Returns the signature headers Contentful issues for a request from this app. */
export type Signer = (request: SignableRequest) => Promise<Record<string, string>>;

/** The server's error message, whatever shape the failed response has. */
async function readError(response: Response, fallback: string): Promise<string> {
  try {
    if (response.headers.get('content-type')?.includes('application/json')) {
      const data = await response.json();
      return data?.error || data?.details?.[0] || fallback;
    }
    return await response.text();
  } catch {
    return `Server error: ${response.status} ${response.statusText}`;
  }
}

/**
 * POSTs JSON to a quiz API route (a Vercel function in apps/web), signed by
 * Contentful so the API knows it comes from this installed app. Resolves with
 * the JSON reply; rejects with a readable error (`fallback` when the server
 * gives none).
 */
export async function signedPost<T>(route: string, payload: unknown, sign: Signer, fallback: string): Promise<T> {
  const url = new URL(`${backendUrl()}${route}`, window.location.href);
  const headers = { 'Content-Type': 'application/json' };
  const body = JSON.stringify(payload);
  let signature: Record<string, string>;
  try {
    signature = await sign({ method: 'POST', path: url.pathname, headers, body });
  } catch (error) {
    // The App SDK rejects with plain objects, not Errors; surface Contentful's message.
    const reason = (error as { message?: string })?.message || JSON.stringify(error);
    throw new Error(`Contentful could not sign the request (is request verification enabled for this app?): ${reason}`);
  }
  const response = await fetch(url, { method: 'POST', headers: { ...headers, ...signature }, body });
  if (!response.ok) {
    throw new Error(await readError(response, fallback));
  }
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error('Invalid response from server. Please check backend logs.');
  }
}
