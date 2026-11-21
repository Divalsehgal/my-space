import { MS_PER_SECOND } from "@dival-sehgal/utils/time";
import {
    CATALOG_CACHE_SECONDS,
    CATALOG_KEY,
    MAX_STORED_MESSAGES,
    RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW_SECONDS,
    SESSION_COOKIE,
    SESSION_ID_PATTERN,
    SESSION_TTL_SECONDS,
} from "../constants/limits";
import type { Catalog, ChatSession, Env } from "../types";

/** Everything the Worker keeps in KV: chat sessions, the catalog and the fallback rate-limit counters. */

const sessionCookiePattern = new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`);

/** Session id from the cookie. Only well-formed ids reach KV: a forged cookie such as "catalog:v1" must not read or overwrite other keys. */
export function readSessionId(req: Request): string | undefined {
    const value = sessionCookiePattern.exec(req.headers.get('Cookie') ?? '')?.[1];
    return value && SESSION_ID_PATTERN.test(value) ? value : undefined;
}

export function sessionCookie(req: Request, sid: string, maxAge = SESSION_TTL_SECONDS): string {
    const crossSiteAttributes = new URL(req.url).protocol === 'https:' ? '; SameSite=None; Secure' : '; SameSite=Lax';
    return `${SESSION_COOKIE}=${sid}; Path=/; HttpOnly${crossSiteAttributes}; Max-Age=${maxAge}`;
}

export async function getSession(env: Env, sid: string | undefined): Promise<ChatSession | null> {
    return sid ? await env.CHAT_SESSIONS.get(sid, { type: 'json' }) as ChatSession | null : null;
}

export async function loadSession(req: Request, env: Env): Promise<{ sess: ChatSession; isNew: boolean }> {
    const stored = await getSession(env, readSessionId(req));
    if (stored && Array.isArray(stored.messages)) {
        return { sess: stored, isNew: false };
    }
    return { sess: { id: `sess_${crypto.randomUUID()}`, messages: [], createdAt: Date.now(), updatedAt: Date.now() }, isNew: true };
}

export async function saveSession(env: Env, sess: ChatSession) {
    sess.messages = sess.messages.slice(-MAX_STORED_MESSAGES);
    sess.updatedAt = Date.now();
    await env.CHAT_SESSIONS.put(sess.id, JSON.stringify(sess), { expirationTtl: SESSION_TTL_SECONDS });
}

export async function readCatalog(env: Env): Promise<Catalog | null> {
    try {
        return await env.CHAT_SESSIONS.get(CATALOG_KEY, { type: 'json', cacheTtl: CATALOG_CACHE_SECONDS }) as Catalog | null;
    } catch {
        return null;
    }
}

/** Per-IP limit per scope ("chat", "mcp"). Fails open: a limiter outage must not take the chat down. */
export async function isRateLimited(req: Request, env: Env, scope: string): Promise<boolean> {
    const ip = req.headers.get('CF-Connecting-IP') || 'unknown';
    try {
        if (env.CHAT_RATE_LIMITER) {
            const { success } = await env.CHAT_RATE_LIMITER.limit({ key: `${scope}:${ip}` });
            return !success;
        }
        // shortcut: KV get→put isn't atomic, so bursts can overshoot; only used when the rate-limit binding is missing.
        const bucket = Math.floor(Date.now() / (RATE_LIMIT_WINDOW_SECONDS * MS_PER_SECOND));
        const key = `rate:${scope}:${ip}:${bucket}`;
        const current = await env.CHAT_SESSIONS.get(key) as string | null;
        const count = current ? Number.parseInt(current, 10) + 1 : 1;
        await env.CHAT_SESSIONS.put(key, count.toString(), { expirationTtl: RATE_LIMIT_WINDOW_SECONDS * 2 });
        return count > RATE_LIMIT_MAX;
    } catch {
        return false;
    }
}
