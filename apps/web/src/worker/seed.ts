import { Env } from "./types";
import { HTTP_STATUS } from "@dival-sehgal/utils/http";
import { EMBEDDING_MODEL } from "./retrieval";
import { buildCatalog, buildChunks, SITE_URL, type ChatContext, type Chunk } from "./chunks";

const EMBED_BATCH_SIZE = 50;
const UPSERT_BATCH_SIZE = 500;
// Vectorize caps deleteByIds at 100 ids per call.
const DELETE_BATCH_SIZE = 100;
/** Hex characters of the SHA-256 kept per chunk; collisions only cost a skipped re-embed. */
const HASH_CHARS = 16;
const HEX = 16;

/** KV key of {id → content hash} for the vectors currently in the index. */
export const MANIFEST_KEY = 'seed:manifest';
/** KV key of the structured catalog (site index + MCP tools). */
export const CATALOG_KEY = 'catalog:v1';

export const getCorsHeaders = (req: Request) => {
    const origin = req.headers.get('Origin');
    const configuredOrigins = [
        'https://divalsehgal.vercel.app',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:8787',
        'http://127.0.0.1:8787',
    ];
    const allowedOrigins = origin && configuredOrigins.includes(origin) ? origin : configuredOrigins[0];

    return {
        'Access-Control-Allow-Origin': allowedOrigins,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Mcp-Protocol-Version, Mcp-Session-Id',
        'Vary': 'Origin',
    };
};

export const json = (d: unknown, s = 200, h: Record<string, string> = {}, req?: Request) => {
    const corsHeaders = req ? getCorsHeaders(req) : { 'Access-Control-Allow-Origin': '*' };
    return new Response(JSON.stringify(d), {
        status: s,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
            ...h
        }
    });
};

function isAuthorizedSeedRequest(req: Request, env: Env): boolean {
    if (!env.SEED_SECRET) {
        return false;
    }

    return req.headers.get('Authorization') === `Bearer ${env.SEED_SECRET}`;
}

async function hashChunk(chunk: Chunk): Promise<string> {
    // Model is part of the hash: switching embedding models re-embeds everything.
    const data = new TextEncoder().encode(`${EMBEDDING_MODEL}\n${chunk.content}\n${JSON.stringify(chunk.metadata)}`);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(digest)].map((b) => b.toString(HEX).padStart(2, '0')).join('').slice(0, HASH_CHARS);
}

/** Ids written by the old positional scheme (`blog-3-1`, `proj-2`…); purged once on migration. */
export function getLegacyVectorIds(): string[] {
    const legacyCount = 50;
    const legacyBlogChunks = 8;
    return [
        ...['faq', 'exp', 'proj', 'blog'].flatMap((prefix) => Array.from({ length: legacyCount }, (_, i) => `${prefix}-${i}`)),
        ...Array.from({ length: legacyCount * legacyBlogChunks }, (_, i) => `blog-${Math.floor(i / legacyBlogChunks)}-${i % legacyBlogChunks}`),
    ];
}

function describeError(err: unknown): string {
    if (err instanceof Error) {
        return err.message;
    }
    return typeof err === 'string' ? err : JSON.stringify(err) ?? 'Unknown error';
}

export async function seed(req: Request, env: Env): Promise<Response> {
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405, headers: getCorsHeaders(req) });
    }

    if (!isAuthorizedSeedRequest(req, env)) {
        return json({ error: 'Unauthorized' }, HTTP_STATUS.UNAUTHORIZED, {}, req);
    }

    try {
        const force = new URL(req.url).searchParams.get('force') === '1';
        const result = await runSeed(env, { force });
        return json({ success: true, ...result }, HTTP_STATUS.OK, {}, req);
    } catch (err: unknown) {
        const message = describeError(err);
        console.error('Seed error:', message);
        return json({ error: 'Seed failed', details: message }, HTTP_STATUS.INTERNAL_SERVER_ERROR, {}, req);
    }
}

export interface SeedResult {
    /** Chunks in the index after this run. */
    count: number;
    /** Chunks embedded and written (new or changed). */
    upserted: number;
    /** Vectors removed because their source content is gone. */
    deleted: number;
}

/**
 * Core seeding routine, shared by the authenticated HTTP handler and the cron
 * trigger. Incremental: only chunks whose content hash changed since the last
 * run are re-embedded (the daily cron usually embeds nothing), new vectors are
 * upserted *before* stale ones are deleted (no window with an empty index),
 * and the structured catalog is refreshed for the site index and MCP tools.
 * `force` re-embeds everything (e.g. after wiping the index by hand).
 */
export async function runSeed(env: Env, { force = false } = {}): Promise<SeedResult> {
    const contextUrl = env.CHAT_CONTEXT_URL || `${SITE_URL}/api/chat-context`;

    const res = await fetch(contextUrl);
    if (!res.ok) {
        throw new Error(`Failed to fetch chat context from ${contextUrl}`);
    }
    const data = await res.json() as ChatContext;
    const chunks = buildChunks(data);
    const hashes = Object.fromEntries(await Promise.all(chunks.map(async (c) => [c.id, await hashChunk(c)] as const)));

    const previous = await env.CHAT_SESSIONS.get(MANIFEST_KEY, { type: 'json' }) as Record<string, string> | null;
    const changed = force || !previous ? chunks : chunks.filter((c) => previous[c.id] !== hashes[c.id]);
    const upserted = await embedAndUpsert(env, changed);

    const current = new Set(chunks.map((c) => c.id));
    const stale = (previous ? Object.keys(previous) : getLegacyVectorIds()).filter((id) => !current.has(id));
    await deleteVectors(env, stale);

    await env.CHAT_SESSIONS.put(MANIFEST_KEY, JSON.stringify(hashes));
    await env.CHAT_SESSIONS.put(CATALOG_KEY, JSON.stringify(buildCatalog(data)));

    return { count: chunks.length, upserted, deleted: previous ? stale.length : 0 };
}

async function embedAndUpsert(env: Env, chunks: Chunk[]): Promise<number> {
    const vecs: { id: string; values: number[]; metadata: Record<string, unknown> }[] = [];
    for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
        const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);
        // Sequential on purpose: one Workers AI request at a time to stay within its rate limit.
        const e = await env.AI.run(EMBEDDING_MODEL, { text: batch.map((b) => b.content) }) as { data?: number[][] }; // NOSONAR
        const embeddings = e.data ?? [];
        if (embeddings.length !== batch.length) {
            throw new Error(`Embedding batch returned ${embeddings.length} vectors for ${batch.length} chunks`);
        }
        batch.forEach((c, idx) => vecs.push({ id: c.id, values: embeddings[idx], metadata: { ...c.metadata, text: c.content } }));
    }
    for (let i = 0; i < vecs.length; i += UPSERT_BATCH_SIZE) {
        await env.VECTORIZE.upsert(vecs.slice(i, i + UPSERT_BATCH_SIZE)); // NOSONAR: sequential to stay within Vectorize limits
    }
    return vecs.length;
}

async function deleteVectors(env: Env, ids: string[]): Promise<void> {
    for (let i = 0; i < ids.length; i += DELETE_BATCH_SIZE) {
        await env.VECTORIZE.deleteByIds(ids.slice(i, i + DELETE_BATCH_SIZE)); // NOSONAR: batches sent one at a time to stay within Vectorize limits
    }
}
