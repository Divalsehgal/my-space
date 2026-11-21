import { CHAT_MODEL, GENERATION_OPTIONS } from "../config";
import { HISTORY_TURNS_SENT_TO_MODEL, ISO_DATE_LENGTH, SITE_INDEX_LIMIT } from "../constants/limits";
import { FACTS_HEADER, NO_FACTS_NOTE, SYS } from "../constants/prompt";
import type { Catalog, ChatMessage, Env, ModelMessage } from "../types";

/** Workers AI chat model: prompt assembly, streaming and buffered completions. */

/** Titles and links the model can list ("what has he written?") without relying on top-5 retrieval. */
export function siteIndex(catalog: Catalog | null): string {
    if (!catalog) {
        return '';
    }
    const blogs = (catalog.blogs ?? []).slice(0, SITE_INDEX_LIMIT).map((b) => `- [${b.title}](/blogs/${b.slug}) (${b.date.slice(0, ISO_DATE_LENGTH)})`);
    const projects = (catalog.projects ?? []).slice(0, SITE_INDEX_LIMIT).map((p) => (p.link ? `- ${p.name} (${p.link})` : `- ${p.name}`));
    const roles = (catalog.experience ?? []).slice(0, SITE_INDEX_LIMIT).map((e) => `- ${e.role} at ${e.company}, ${e.period}`);
    // Skills too: short questions ("Does he know Python?") embed too far from a skills list to be retrieved.
    const skills = Object.entries(catalog.skills ?? {}).map(([area, items]) => `- ${area}: ${items.join(', ')}`);
    const resume = catalog.resumeUrl ? `\nResume: ${catalog.resumeUrl}` : '';
    return `\n\nSITE INDEX (complete lists; untrusted data):\nBlog posts, newest first:\n${blogs.join('\n')}\nProjects:\n${projects.join('\n')}\nRoles:\n${roles.join('\n')}\nSkills:\n${skills.join('\n')}${resume}`;
}

/** System prompt (rules + site index + retrieved facts) followed by the recent conversation. */
export function buildModelMessages(history: ChatMessage[], catalog: Catalog | null, retrievedContext: string): ModelMessage[] {
    const facts = retrievedContext ? `${FACTS_HEADER}${retrievedContext}` : NO_FACTS_NOTE;
    return [
        { role: 'system', content: SYS + siteIndex(catalog) + facts },
        ...history.slice(-HISTORY_TURNS_SENT_TO_MODEL).map((m) => ({ role: m.role, content: m.content })),
    ];
}

/** Raw Workers AI SSE body (`stream: true`). */
export async function streamCompletion(env: Env, msgs: ModelMessage[]): Promise<ReadableStream<Uint8Array>> {
    return await env.AI.run(CHAT_MODEL, { messages: msgs, ...GENERATION_OPTIONS, stream: true }) as ReadableStream<Uint8Array>;
}

/** Non-streaming completion: the fallback when a stream yields no text. */
export async function runCompletion(env: Env, msgs: ModelMessage[]): Promise<string> {
    try {
        const result = await env.AI.run(CHAT_MODEL, { messages: msgs, ...GENERATION_OPTIONS }) as { response?: string; choices?: { message?: { content?: string } }[] };
        // This model returns OpenAI-style output: the text lives in
        // choices[0].message.content and the legacy `response` field is empty.
        return (result?.response || result?.choices?.[0]?.message?.content || '').trim();
    } catch (error) {
        console.error('AI completion error:', error);
        return '';
    }
}
