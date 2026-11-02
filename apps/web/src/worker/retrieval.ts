import { Env, ChatMessage, ChatSource } from "./types";

export const EMBEDDING_MODEL = '@cf/baai/bge-base-en-v1.5';
/** Queries shorter than this are treated as follow-ups and enriched with the previous turn. */
const SHORT_QUERY_CHARS = 20;
/** Vector matches below this similarity are dropped as irrelevant. */
const MIN_RELEVANCE_SCORE = 0.65;
const DEFAULT_TOP_K = 5;

// Ambiguous, short, or pronoun-heavy messages ("tell me more", "why?") retrieve
// poorly on their own, so their query is enriched with the prior user turn.
export const followUpTerms = ['it', 'that', 'this', 'more', 'explain', 'summarize', 'summary', 'why', 'how'];
const followUpPattern = new RegExp(`\\b(?:${followUpTerms.join('|')})\\b`, 'i');

export const isFollowUp = (q: string) => followUpPattern.test(q);

export interface RetrievalMatch {
    id?: string;
    score?: number;
    metadata?: { text?: string; type?: string; title?: string; url?: string };
}

export interface Retrieval {
    context: string;
    /** Best similarity among the matches; 0 when nothing was retrieved. */
    topScore: number;
    sources: ChatSource[];
    matches: RetrievalMatch[];
}

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

export function faq(env: Env, q: string, priorTurns: ChatMessage[], activeBlogPath?: string): Promise<Retrieval> {
    return search(env, buildRetrievalQuery(q, priorTurns, activeBlogPath));
}
