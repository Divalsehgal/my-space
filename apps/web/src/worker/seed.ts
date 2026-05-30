import { Env } from "./types";

export const getCorsHeaders = (req: Request) => {
    const origin = req.headers.get('Origin') || '*';
    const configuredOrigins = ['https://divalsehgal.vercel.app', 'http://localhost:3000'];
    const allowedOrigins = configuredOrigins.includes(origin) ? origin : configuredOrigins[0];

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
        ...Array.from({ length: maxSeededItems }, (_, i) => `exp-${i}`),
        ...Array.from({ length: maxSeededItems }, (_, i) => `proj-${i}`),
        ...Array.from({ length: maxSeededItems }, (_, i) => `blog-${i}`),
        ...Array.from(
            { length: maxSeededItems * maxBlogChunks },
            (_, i) => `blog-${Math.floor(i / maxBlogChunks)}-${i % maxBlogChunks}`
        )
    ];
}

export async function seed(req: Request, env: Env): Promise<Response> {
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405, headers: getCorsHeaders(req) });
    }

    if (!isAuthorizedSeedRequest(req, env)) {
        return json({ error: 'Unauthorized' }, 401, {}, req);
    }

    const contextUrl = env.CHAT_CONTEXT_URL || `${fallbackSiteUrl}/api/chat-context`;
    
    try {
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

        const vecs = await Promise.all(chunks.map(async (c) => {
            const content = sanitizeContent(c.content, 1600);
            const e = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [content] }) as { data?: number[][] };
            return { id: c.id, values: e.data?.[0] || [], metadata: { ...c.metadata, text: content } };
        }));
        
        await env.VECTORIZE.deleteByIds(getManagedVectorIds());
        await env.VECTORIZE.upsert(vecs);
        
        return json({ success: true, count: chunks.length }, 200, {}, req);
    } catch (err: unknown) { 
        const message = err instanceof Error ? err.message : String(err);
        console.error('Seed error:', message);
        return json({ error: 'Seed failed', details: message }, 500, {}, req); 
    }
}
