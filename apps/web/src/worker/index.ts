import { Env, ChatSession } from "./types";
import { getCorsHeaders, json, seed } from "./seed";

const OFF_TOPIC_REPLY = "I can only help with Dival Sehgal's portfolio, engineering experience, projects, skills, contact details, and blog posts. Try asking about his work, tech stack, projects, or writing.";

const SYS = `You are Dival Sehgal's portfolio assistant for divalsehgal.vercel.app.

RULES:
1. SCOPE: Only answer questions about Dival Sehgal's portfolio website, career, projects, skills, contact details, and blog posts.
2. FACTS: Use only the provided facts and recent conversation. Do not invent employers, projects, dates, skills, claims, links, or blog details.
3. REFUSAL: If a question asks for general AI help, coding help unrelated to Dival's work, news, finance, homework, politics, personal advice, or anything outside this portfolio/blog scope, reply with a short refusal and suggest asking about Dival's work.
4. CONTACT FLOW: If a user wants to "contact", "message", or "get in touch" with Dival:
   - Step A: Ask for their Name, Email, and the Message they want to send.
   - Step B: Once you have all 3, confirm the details with the user.
   - Step C: If they confirm (e.g. "Send it"), output this EXACT token at the end of your response: [SUBMIT_CONTACT: {"name": "NAME", "email": "EMAIL", "message": "MSG"}]
5. CONFIRMATION: After the token, tell the user you have forwarded their message to Dival.
6. STYLE: Keep answers concise, specific, and grounded in the portfolio/blog context.`;

const TTL = 30 * 24 * 60 * 60;

const cookie = (r: Request) => r.headers.get('Cookie')?.match(/chatbot_session=([^;]+)/)?.[1];

const portfolioTerms = [
    'dival', 'sehgal', 'portfolio', 'website', 'site', 'blog', 'post', 'article',
    'project', 'projects', 'work', 'experience', 'career', 'company', 'role',
    'skill', 'skills', 'tech', 'stack', 'resume', 'cv', 'contact', 'email',
    'message', 'hire', 'hiring', 'developer', 'engineer', 'frontend', 'backend',
    'full stack', 'next', 'react', 'typescript', 'cloudflare', 'contentful'
];

const greetingTerms = ['hi', 'hello', 'hey', 'thanks', 'thank you', 'what can you do', 'help'];

const sseHeaders = (req: Request, extra: Record<string, string> = {}) => ({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    ...getCorsHeaders(req),
    ...extra
});

function chatStream(req: Request, text: string, headers: Record<string, string> = {}) {
    return new Response(
        `data: ${JSON.stringify({ response: text })}\n\ndata: [DONE]\n\n`,
        { headers: sseHeaders(req, headers) }
    );
}

function isInPortfolioScope(message: string | undefined, hasStrongContext: boolean): boolean {
    const msg = message?.toLowerCase().trim() || '';
    if (hasStrongContext) {
        return true;
    }
    return portfolioTerms.some(term => msg.includes(term)) || greetingTerms.includes(msg);
}

function stripContactToken(text: string): { cleaned: string; contact?: { name: string; email: string; message: string } } {
    const contactMatch = text.match(/\[SUBMIT_CONTACT:\s*(\{.*?\})\]/);
    if (!contactMatch) {
        return { cleaned: text.trim() };
    }

    try {
        const contact = JSON.parse(contactMatch[1]) as { name: string; email: string; message: string };
        return { cleaned: text.replace(contactMatch[0], '').trim(), contact };
    } catch {
        return { cleaned: text.replace(contactMatch[0], '').trim() };
    }
}

async function faq(env: Env, q: string): Promise<{ text: string; hasStrongContext: boolean }> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [q] }) as any;
        if (!e.data) {
            return { text: '', hasStrongContext: false };
        }
        const r = await env.VECTORIZE.query(e.data[0], { topK: 3, returnMetadata: 'all' });
        const matches = r.matches as { score?: number; metadata?: { text?: string } }[];
        const relevantMatches = matches.filter((m) => typeof m.score !== 'number' || m.score >= 0.65);
        return {
            text: relevantMatches.map((m) => m.metadata?.text || '').filter(Boolean).join('\n\n'),
            hasStrongContext: relevantMatches.length > 0
        };
    } catch {
        return { text: '', hasStrongContext: false };
    }
}

async function trackQuestion(env: Env, q: string) {
    try {
        const normalized = q.toLowerCase().trim().replace(/[?.,!]/g, '').slice(0, 50);
        const key = `stats:q:${normalized}`;
        const current = await env.CHAT_SESSIONS.get(key) as string | null;
        const count = current ? parseInt(current) + 1 : 1;
        await env.CHAT_SESSIONS.put(key, count.toString());
    } catch {
        /* ignore stats errors */
    }
}

async function validateMessage(message: string | undefined): Promise<{ valid: boolean; reason?: string }> {
    const blocked = ['crypto', 'bitcoin', 'gambling', 'dating', 'adult', 'politics', 'offensive'];
    const msg = message?.toLowerCase().trim() || '';

    if (blocked.some(word => msg.includes(word))) {
        return { valid: false, reason: OFF_TOPIC_REPLY };
    }

    if (!message || message.length > 500) {
        return { valid: false, reason: "Please keep your questions concise so I can provide the best technical insights." };
    }

    return { valid: true };
}

async function chat(req: Request, env: Env): Promise<Response> {
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405, headers: getCorsHeaders(req) });
    }
    const { message } = await req.json() as { message?: string };
    const trimmedMessage = message?.trim();
    if (!trimmedMessage) {
        return json({ error: 'Message required' }, 400, {}, req);
    }

    const validation = await validateMessage(message);
    if (!validation.valid) {
        return chatStream(req, validation.reason || OFF_TOPIC_REPLY);
    }

    await trackQuestion(env, message ?? "");

    let sid = cookie(req);
    let isNew = !sid;
    let sess = sid ? await env.CHAT_SESSIONS.get(sid, { type: 'json' }) as ChatSession | null : null;

    if (!sess) {
        sid = 'sess_' + crypto.randomUUID();
        sess = { id: sid, messages: [], createdAt: Date.now(), updatedAt: Date.now() };
        isNew = true;
    }

    sess.messages.push({ role: 'user', content: trimmedMessage, timestamp: Date.now() });
    const ctx = await faq(env, message ?? "");

    const cookieHeader: Record<string, string> = isNew && sid
        ? { 'Set-Cookie': `chatbot_session=${sid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${TTL}` }
        : {};

    if (!sid) {
        return chatStream(req, "Sorry, I could not start a chat session. Please try again.");
    }

    if (!isInPortfolioScope(trimmedMessage, ctx.hasStrongContext)) {
        sess.messages.push({ role: 'assistant', content: OFF_TOPIC_REPLY, timestamp: Date.now() });
        sess.updatedAt = Date.now();
        await env.CHAT_SESSIONS.put(sid, JSON.stringify(sess), { expirationTtl: TTL });
        return chatStream(req, OFF_TOPIC_REPLY, cookieHeader);
    }

    const msgs = [
        { role: 'system', content: SYS + (ctx.text ? `\n\nAPPROVED PORTFOLIO/BLOG FACTS:\n${ctx.text}` : '\n\nNo matching portfolio facts were retrieved. Answer only if the recent conversation already contains the needed portfolio facts; otherwise say you do not have that detail yet.') },
        ...sess.messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
    ];

    const llamaRun = env.AI.run as (model: string, options: { messages: { role: string; content: string }[]; stream: boolean }) => Promise<ReadableStream>;
    const stream = await llamaRun('@cf/meta/llama-3-8b-instruct', { messages: msgs, stream: true });
    let full = '';

    const { readable, writable } = new TransformStream({
        transform(chunk) {
            for (const ln of new TextDecoder().decode(chunk).split('\n')) {
                if (ln.startsWith('data: ') && ln.slice(6) !== '[DONE]') {
                    try {
                        const part = JSON.parse(ln.slice(6));
                        full += part.response || '';
                    } catch { }
                }
            }
        },
        async flush(ctrl) {
            if (!full) {
                full = "I do not have enough portfolio context to answer that confidently yet.";
            }
            if (full && sess && sid) {
                const { cleaned, contact } = stripContactToken(full);
                full = cleaned || "I do not have enough portfolio context to answer that confidently yet.";

                if (contact) {
                    try {
                        const contactUrl = env.CONTACT_API_URL || `${new URL(req.url).origin}/api/contact`;
                        await fetch(contactUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(contact)
                        });
                    } catch (e) {
                        console.error('Contact submission error:', e);
                    }
                }

                sess.messages.push({ role: 'assistant', content: full, timestamp: Date.now() });
                sess.updatedAt = Date.now();
                await env.CHAT_SESSIONS.put(sid, JSON.stringify(sess), { expirationTtl: TTL });
            }
            ctrl.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ response: full })}\n\ndata: [DONE]\n\n`));
        }
    });

    stream.pipeTo(writable).catch((error) => console.error('AI stream error:', error));

    return new Response(readable, {
        headers: sseHeaders(req, cookieHeader)
    });
}

const worker = {
    async fetch(req: Request, env: Env): Promise<Response> {
        const p = new URL(req.url).pathname;
        if (req.method === 'OPTIONS') {
            return new Response(null, {
                headers: getCorsHeaders(req)
            });
        }
        if (p === '/api/chat') {
            return chat(req, env);
        }
        if (p === '/api/history') {
            const s = cookie(req);
            const sess = s ? await env.CHAT_SESSIONS.get(s, { type: 'json' }) as ChatSession | null : null;
            return json({ messages: sess?.messages || [] }, 200, {}, req);
        }
        if (p === '/api/seed') {
            return seed(req, env);
        }
        if (p === '/api/health') {
            return json({ status: 'ok' }, 200, {}, req);
        }
        return new Response('Not found', { status: 404 });
    }
};

export default worker;
