import { Env, ChatSession } from "./types";
import { getCorsHeaders, json, seed } from "./seed";

const SYS = `You are Dival Sehgal's AI Technical Assistant. Your mission is to represent Dival's professional engineering portfolio with high fidelity.

RULES:
1. SCOPE: Only answer questions about Dival's career, projects, skills, and blog posts. Politely decline general-purpose AI tasks or off-topic questions.
2. CONTACT FLOW: If a user wants to "contact", "message", or "get in touch" with Dival:
   - Step A: Ask for their Name, Email, and the Message they want to send.
   - Step B: Once you have all 3, confirm the details with the user.
   - Step C: If they confirm (e.g. "Send it"), output this EXACT token at the end of your response: [SUBMIT_CONTACT: {"name": "NAME", "email": "EMAIL", "message": "MSG"}]
3. CONFIRMATION: After the token, tell the user you have forwarded their message to Dival.
4. TONE: Professional, engineering-centric, and authoritative.`;

const TTL = 30 * 24 * 60 * 60;

const cookie = (r: Request) => r.headers.get('Cookie')?.match(/chatbot_session=([^;]+)/)?.[1];

async function faq(env: Env, q: string): Promise<string> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [q] }) as any;
        if (!e.data) {
            return '';
        }
        const r = await env.VECTORIZE.query(e.data[0], { topK: 3, returnMetadata: 'all' });
        return (r.matches as { metadata?: { text?: string } }[]).map((m) => m.metadata?.text || '').join('\n\n');
    } catch {
        return '';
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

async function validateMessage(message: string): Promise<{ valid: boolean; reason?: string }> {
    const blocked = ['crypto', 'bitcoin', 'gambling', 'dating', 'adult', 'politics', 'offensive'];
    const msg = message.toLowerCase();
    
    if (blocked.some(word => msg.includes(word))) {
        return { valid: false, reason: "I'm here to discuss Dival's professional portfolio. Let's keep the conversation focused on engineering and career insights." };
    }
    
    if (message.length > 500) {
        return { valid: false, reason: "Please keep your questions concise so I can provide the best technical insights." };
    }
    
    return { valid: true };
}

async function chat(req: Request, env: Env): Promise<Response> {
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405, headers: getCorsHeaders(req) });
    }
    const { message } = await req.json() as { message?: string };
    if (!message?.trim()) {
        return json({ error: 'Message required' }, 400, {}, req);
    }
    
    const validation = await validateMessage(message);
    if (!validation.valid) {
        return json({ assistant: validation.reason }, 200, {}, req);
    }

    await trackQuestion(env, message);
    
    let sid = cookie(req);
    let isNew = !sid;
    let sess = sid ? await env.CHAT_SESSIONS.get(sid, { type: 'json' }) as ChatSession | null : null;
    
    if (!sess) { 
        sid = 'sess_' + crypto.randomUUID(); 
        sess = { id: sid, messages: [], createdAt: Date.now(), updatedAt: Date.now() }; 
        isNew = true; 
    }
    
    sess.messages.push({ role: 'user', content: message.trim(), timestamp: Date.now() });
    const ctx = await faq(env, message);
    const msgs = [
        { role: 'system', content: SYS + (ctx ? `\n\nPROVEN FACTS ABOUT DIVAL SEHGAL:\n${ctx}` : '') }, 
        ...sess.messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
    ];
    
    const llamaRun = env.AI.run as (model: string, options: { messages: { role: string; content: string }[]; stream: boolean }) => Promise<ReadableStream>;
    const stream = await llamaRun('@cf/meta/llama-3-8b-instruct', { messages: msgs, stream: true });
    let full = '';
    
    const { readable, writable } = new TransformStream({
        transform(chunk, ctrl) {
            for (const ln of new TextDecoder().decode(chunk).split('\n')) {
                if (ln.startsWith('data: ') && ln.slice(6) !== '[DONE]') {
                    try { 
                        const part = JSON.parse(ln.slice(6));
                        full += part.response || ''; 
                    } catch { }
                }
            }
            ctrl.enqueue(chunk);
        },
        async flush() {
            if (full && sess && sid) { 
                const contactMatch = full.match(/\[SUBMIT_CONTACT:\s*(\{.*?\})\]/);
                if (contactMatch) {
                    try {
                        const data = JSON.parse(contactMatch[1]);
                        const baseUrl = new URL(req.url).origin;
                        await fetch(`${baseUrl}/api/contact`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(data)
                        });
                        full = full.replace(contactMatch[0], '').trim();
                    } catch (e) {
                        console.error('Contact submission error:', e);
                    }
                }

                sess.messages.push({ role: 'assistant', content: full, timestamp: Date.now() }); 
                sess.updatedAt = Date.now(); 
                await env.CHAT_SESSIONS.put(sid, JSON.stringify(sess), { expirationTtl: TTL }); 
            }
        }
    });
    
    stream.pipeTo(writable);
    
    return new Response(readable, { 
        headers: { 
            'Content-Type': 'text/event-stream', 
            'Cache-Control': 'no-cache', 
            ...getCorsHeaders(req), 
            ...(isNew ? { 'Set-Cookie': `chatbot_session=${sid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${TTL}` } : {}) 
        } 
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
