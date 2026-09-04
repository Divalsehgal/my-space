import { Env, ChatMessage } from "./types";

// Ambiguous, short, or pronoun-heavy messages ("tell me more", "why?") retrieve
// poorly on their own, so their query is enriched with the prior user turn.
export const followUpTerms = ['it', 'that', 'this', 'more', 'explain', 'summarize', 'summary', 'why', 'how'];

function buildRetrievalQuery(q: string, priorTurns: ChatMessage[], activeBlogPath?: string): string {
    const isShortOrFollowUp = q.length < 20 || followUpTerms.some((term) => q.toLowerCase().includes(term));
    const priorUserMessage = isShortOrFollowUp
        ? priorTurns.filter((m) => m.role === 'user').at(-1)?.content
        : undefined;

    const parts = [priorUserMessage, q, activeBlogPath ? `Current blog page: ${activeBlogPath}` : undefined];
    return parts.filter(Boolean).join('\n');
}

export async function faq(env: Env, q: string, priorTurns: ChatMessage[], activeBlogPath?: string): Promise<string> {
    try {
        const retrievalQuery = buildRetrievalQuery(q, priorTurns, activeBlogPath);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [retrievalQuery] }) as any;
        if (!e.data) {
            return '';
        }
        const r = await env.VECTORIZE.query(e.data[0], { topK: 5, returnMetadata: 'all' });
        const matches = r.matches as { score?: number; metadata?: { text?: string } }[];
        const relevantMatches = matches.filter((m) => typeof m.score !== 'number' || m.score >= 0.65);
        return relevantMatches.map((m) => m.metadata?.text || '').filter(Boolean).join('\n\n');
    } catch {
        return '';
    }
}
