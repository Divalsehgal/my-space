import { Env } from "./types";

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
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

interface Portfolio {
    hero: { title: string; subtitle: string };
    about: { facts: string[] };
    experience: { company: string; role: string; period: string; description: { text: string }[]; techStack: string[] }[];
    projects: { name: string; description: string; techStack: string[] }[];
    contact: { email: string; subtitle: string };
}

interface Blog {
    title: string;
    description: string;
    content: string;
    slug: string;
    date: string;
    tags: string[];
}

const fallbackSiteUrl = 'https://divalsehgal.vercel.app';
const maxBlogChunks = 8;
const maxSeededItems = 50;

function isAuthorizedSeedRequest(req: Request, env: Env): boolean {
    if (!env.SEED_SECRET) {
        return false;
    }

    return req.headers.get('Authorization') === `Bearer ${env.SEED_SECRET}`;
}

function sanitizeContent(value: string | undefined, maxLength = 1400): string {
    return (value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function chunkBlogContent(blog: Blog): string[] {
    const content = sanitizeContent(blog.content, maxBlogChunks * 1400);
    const chunks = content.match(/.{1,1400}(?:\s|$)/g)?.map((chunk) => chunk.trim()) || [];
    return chunks.length ? chunks.slice(0, maxBlogChunks) : [sanitizeContent(blog.description)];
}

function getManagedVectorIds(): string[] {
    return [
        'info-general',
        'info-experience-summary',
        'info-contact',
        // Legacy ids from an earlier seeding scheme. They carry no `text`
        // metadata but still match queries, starving the model of context.
        // Include them so every re-seed purges the stale vectors.
        ...Array.from({ length: maxSeededItems }, (_, i) => `faq-${i}`),
        ...Array.from({ length: maxSeededItems }, (_, i) => `exp-${i}`),
        ...Array.from({ length: maxSeededItems }, (_, i) => `proj-${i}`),
        ...Array.from({ length: maxSeededItems }, (_, i) => `blog-${i}`),
        ...Array.from(
            { length: maxSeededItems * maxBlogChunks },
            (_, i) => `blog-${Math.floor(i / maxBlogChunks)}-${i % maxBlogChunks}`
        )
    ];
}

// Vectorize caps deleteByIds at 100 ids per call, so delete in batches.
async function deleteManagedVectors(env: Env): Promise<void> {
    const ids = getManagedVectorIds();
    const deleteBatchSize = 100;
    for (let i = 0; i < ids.length; i += deleteBatchSize) {
        await env.VECTORIZE.deleteByIds(ids.slice(i, i + deleteBatchSize));
    }
}

export async function seed(req: Request, env: Env): Promise<Response> {
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405, headers: getCorsHeaders(req) });
    }

    if (!isAuthorizedSeedRequest(req, env)) {
        return json({ error: 'Unauthorized' }, 401, {}, req);
    }

    try {
        const count = await runSeed(env);
        return json({ success: true, count }, 200, {}, req);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('Seed error:', message);
        return json({ error: 'Seed failed', details: message }, 500, {}, req);
    }
}

/**
 * Core seeding routine. Fetches the portfolio + blog context, converts it into
 * text chunks, embeds them, purges stale vectors, and upserts the fresh set
 * into Vectorize. Shared by the authenticated HTTP handler and the scheduled
 * (cron) trigger, so both paths stay perfectly in sync.
 *
 * Reads everything from the Worker `env` bindings and vars (AI, VECTORIZE,
 * CHAT_CONTEXT_URL) — no secrets or manual input required.
 */
export async function runSeed(env: Env): Promise<number> {
    const contextUrl = env.CHAT_CONTEXT_URL || `${fallbackSiteUrl}/api/chat-context`;

    const res = await fetch(contextUrl);
    if (!res.ok) {
        throw new Error(`Failed to fetch chat context from ${contextUrl}`);
    }
    const data = await res.json() as { portfolio: Portfolio; blogs: Blog[] };
    const { portfolio, blogs } = data;

    const chunks: { id: string; content: string; metadata: Record<string, unknown> }[] = [];

    chunks.push({
        id: 'info-general',
        content: `Dival Sehgal is a ${portfolio.hero.title}. ${portfolio.hero.subtitle} He is based in ${portfolio.about.facts?.[0] || 'Bengaluru, India'}.`,
        metadata: { type: 'general' }
    });

    const companies = portfolio.experience.map((e) => e.company).join(', ');
    chunks.push({
        id: 'info-experience-summary',
        content: `Dival Sehgal has worked at ${portfolio.experience.length} companies: ${companies}.`,
        metadata: { type: 'experience_summary' }
    });

    portfolio.experience.slice(0, maxSeededItems).forEach((e, i) => {
        chunks.push({
            id: `exp-${i}`,
            content: `At ${e.company}, Dival served as ${e.role} from ${e.period}. Highlights: ${e.description.map((d) => d.text).join(' ')} Tech Stack: ${e.techStack?.join(', ')}.`,
            metadata: { type: 'experience', company: e.company }
        });
    });

    portfolio.projects.slice(0, maxSeededItems).forEach((p, i) => {
        chunks.push({
            id: `proj-${i}`,
            content: `Project ${p.name}: ${p.description}. Technologies used: ${p.techStack?.join(', ')}.`,
            metadata: { type: 'project', name: p.name }
        });
    });

    blogs.slice(0, maxSeededItems).forEach((b, i) => {
        chunkBlogContent(b).forEach((content, chunkIndex) => {
            chunks.push({
                id: `blog-${i}-${chunkIndex}`,
                content: `Blog Post: ${sanitizeContent(b.title, 180)}. Summary: ${sanitizeContent(b.description, 320)}. Content excerpt: ${content}. Published on: ${sanitizeContent(b.date, 80)}. URL: /blogs/${sanitizeContent(b.slug, 180)}`,
                metadata: { type: 'blog', title: b.title, slug: b.slug, chunk: chunkIndex }
            });
        });
    });

    chunks.push({
        id: 'info-contact',
        content: `Contact Dival Sehgal at ${portfolio.contact.email}. ${portfolio.contact.subtitle}`,
        metadata: { type: 'contact' }
    });

    // Batch embedding generation to stay within the Worker per-invocation
    // subrequest limit. One AI.run call embeds up to `embedBatchSize` texts,
    // instead of one subrequest per chunk (which overflowed the limit).
    const prepared = chunks.map((c) => ({ ...c, content: sanitizeContent(c.content, 1600) }));
    const embedBatchSize = 50;
    const vecs: { id: string; values: number[]; metadata: Record<string, unknown> }[] = [];
    for (let i = 0; i < prepared.length; i += embedBatchSize) {
        const batch = prepared.slice(i, i + embedBatchSize);
        const e = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: batch.map((b) => b.content) }) as { data?: number[][] };
        const embeddings = e.data || [];
        batch.forEach((c, idx) => {
            vecs.push({ id: c.id, values: embeddings[idx] || [], metadata: { ...c.metadata, text: c.content } });
        });
    }

    await deleteManagedVectors(env);
    await env.VECTORIZE.upsert(vecs);

    return chunks.length;
}
