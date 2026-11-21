import { SITE_URL, EMBEDDING_MODEL } from "../config";
import { CATALOG_KEY, DELETE_BATCH_SIZE, EMBED_BATCH_SIZE, HASH_CHARS, MANIFEST_KEY, UPSERT_BATCH_SIZE } from "../constants/limits";
import type { ChatContext, Chunk, Env, SeedResult } from "../types";
import { buildCatalog, buildChunks } from "../utils/chunks";

/** Re-indexing: /api/chat-context → embeddings in Vectorize + the catalog in KV. */

const HEX = 16;

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
