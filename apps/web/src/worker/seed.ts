import { Env } from "./types";

export const getCorsHeaders = (req: Request) => {
    const origin = req.headers.get('Origin') || '*';
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
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

async function getContextUrl(req: Request, env: Env): Promise<string> {
    const fallbackSiteUrl = 'https://divalsehgal.vercel.app';

    try {
        const body = await req.clone().json() as { contextUrl?: string };
        if (body.contextUrl) {
            return body.contextUrl;
        }
    } catch {
        /* POST /api/seed does not require a JSON body */
    }

    return env.CHAT_CONTEXT_URL || `${fallbackSiteUrl}/api/chat-context`;
}

export async function seed(req: Request, env: Env): Promise<Response> {
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405, headers: getCorsHeaders(req) });
    }
    
    const CONTEXT_URL = await getContextUrl(req, env);
    
    try {
        const res = await fetch(CONTEXT_URL);
        if (!res.ok) {
            throw new Error(`Failed to fetch chat context from ${CONTEXT_URL}`);
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

        portfolio.experience.forEach((e, i) => {
            chunks.push({
                id: `exp-${i}`,
                content: `At ${e.company}, Dival served as ${e.role} from ${e.period}. Highlights: ${e.description.map((d) => d.text).join(' ')} Tech Stack: ${e.techStack?.join(', ')}.`,
                metadata: { type: 'experience', company: e.company }
            });
        });

        portfolio.projects.forEach((p, i) => {
            chunks.push({
                id: `proj-${i}`,
                content: `Project ${p.name}: ${p.description}. Technologies used: ${p.techStack?.join(', ')}.`,
                metadata: { type: 'project', name: p.name }
            });
        });

        blogs.forEach((b, i) => {
            chunks.push({
                id: `blog-${i}`,
                content: `Blog Post: ${b.title}. Content: ${b.content}. Published on: ${b.date}. URL: /blogs/${b.slug}`,
                metadata: { type: 'blog', title: b.title, slug: b.slug }
            });
        });

        chunks.push({
            id: 'info-contact',
            content: `Contact Dival Sehgal at ${portfolio.contact.email}. ${portfolio.contact.subtitle}`,
            metadata: { type: 'contact' }
        });

        const vecs = await Promise.all(chunks.map(async (c) => {
            const e = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [c.content] }) as { data?: number[][] };
            return { id: c.id, values: e.data?.[0] || [], metadata: { ...c.metadata, text: c.content } };
        }));
        
        await env.VECTORIZE.upsert(vecs);
        
        return json({ success: true, count: chunks.length }, 200, {}, req);
    } catch (err: unknown) { 
        const message = err instanceof Error ? err.message : String(err);
        console.error('Seed error:', message);
        return json({ error: 'Seed failed', details: message }, 500, {}, req); 
    }
}
