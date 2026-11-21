import { EMBEDDING_MODEL } from "../config";
import { DEFAULT_TOP_K, MIN_RELEVANCE_SCORE, SHORT_QUERY_CHARS } from "../constants/limits";
import type { ChatMessage, ChatSource, Env, Retrieval, RetrievalMatch } from "../types";
import { isFollowUp } from "../utils/guards";

/** Retrieval over the Vectorize index, shared by the chat and the MCP search tool. */

const EMPTY: Retrieval = { context: '', topScore: 0, sources: [], matches: [] };

function buildRetrievalQuery(q: string, priorTurns: ChatMessage[], activeBlogPath?: string): string {
    const isShortOrFollowUp = q.length < SHORT_QUERY_CHARS || isFollowUp(q);
    const priorUserMessage = isShortOrFollowUp
        ? priorTurns.findLast((m) => m.role === 'user')?.content
        : undefined;

    const parts = [priorUserMessage, q, activeBlogPath ? `Current blog page: ${activeBlogPath}` : undefined];
    return parts.filter(Boolean).join('\n');
}

/** Unique links (blog posts, project pages) behind the retrieved chunks. */
function toSources(matches: RetrievalMatch[]): ChatSource[] {
    const byUrl = new Map<string, ChatSource>();
    for (const m of matches) {
        const { title, url } = m.metadata ?? {};
        if (title && url && !byUrl.has(url)) {
            byUrl.set(url, { title, url });
        }
    }
    return [...byUrl.values()];
}

/** Embeds a raw query and returns the relevant matches (shared by chat and MCP search). */
export async function search(env: Env, query: string, topK = DEFAULT_TOP_K): Promise<Retrieval> {
    try {
        const e = await env.AI.run(EMBEDDING_MODEL, { text: [query] }) as { data?: number[][] };
        if (!e.data?.[0]) {
            return EMPTY;
        }
        const r = await env.VECTORIZE.query(e.data[0], { topK, returnMetadata: 'all' });
        const matches = (r.matches as RetrievalMatch[])
            .filter((m) => typeof m.score !== 'number' || m.score >= MIN_RELEVANCE_SCORE)
            .filter((m) => m.metadata?.text);
        return {
            context: matches.map((m) => m.metadata?.text).join('\n\n'),
            topScore: Math.max(0, ...matches.map((m) => m.score ?? 0)),
            sources: toSources(matches),
            matches,
        };
    } catch (error) {
        console.error('Retrieval error:', error);
        return EMPTY;
    }
}

/** Chat retrieval: the question, enriched with the previous turn for follow-ups and with the open blog page. */
export function faq(env: Env, q: string, priorTurns: ChatMessage[], activeBlogPath?: string): Promise<Retrieval> {
    return search(env, buildRetrievalQuery(q, priorTurns, activeBlogPath));
}
