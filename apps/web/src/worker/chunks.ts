import type { Catalog } from "./types";
import { splitIntoSentences } from "./sentences";

/**
 * Pure transforms from /api/chat-context to what the Worker stores: embedding
 * chunks for Vectorize and the structured catalog for KV. No I/O, so the
 * shape of the knowledge base is unit-testable on its own.
 */

// Character budgets for text stored alongside each embedding.
const MAX_TITLE_CHARS = 180;
const MAX_SUMMARY_CHARS = 320;
const MAX_DATE_CHARS = 80;
const MAX_CHUNK_CHARS = 1600;
const MAX_CHUNK_BODY_CHARS = 1200;
/** Long posts (40k+ chars) are indexed in full instead of their first ~10k chars. */
const MAX_BLOG_CHUNKS = 40;
export const MAX_SEEDED_ITEMS = 50;
const MAX_ID_PART = 40;

/** Translated intro copy served by /api/chat-context (from Contentful). */
interface Profile {
    name: string;
    role: string;
    summary: string;
    about: string;
    contactIntro: string;
}

type SkillGroup = { name: string; level?: string }[] | Record<string, { name: string; level?: string }[]>;

interface Portfolio {
    experience: { company: string; role: string; period: string; description: { text: string }[]; techStack?: string[] }[];
    projects: { name: string; description: string; techStack?: string[]; link?: string; repo?: string }[];
    skills?: Record<string, SkillGroup>;
    socials?: { label: string; href: string }[];
    contact?: { email: string };
    resumeUrl?: string;
}

interface Blog {
    title: string;
    description: string;
    content: string;
    slug: string;
    date: string;
}

export interface ChatContext {
    profile: Profile;
    portfolio: Portfolio;
    blogs: Blog[];
}

export interface Chunk {
    id: string;
    content: string;
    metadata: { type: string; title?: string; url?: string; [key: string]: unknown };
}

export const SITE_URL = 'https://divalsehgal.vercel.app';
const homeLocation = 'Bengaluru, India';

function sanitizeContent(value: string | undefined, maxLength = MAX_CHUNK_BODY_CHARS): string {
    return (value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

/** "aiEngineering" → "ai engineering". */
const humanize = (key: string) => key.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();

/** Stable, readable id fragment (Vectorize ids are capped at 64 bytes). */
const idPart = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, MAX_ID_PART) || 'x';

// Packs sentences greedily up to MAX_CHUNK_BODY_CHARS instead of slicing at
// fixed character offsets, so a chunk (and its embedding) never starts or ends
// mid-sentence.
function chunkBlogContent(blog: Blog): string[] {
    const content = sanitizeContent(blog.content, MAX_BLOG_CHUNKS * MAX_CHUNK_BODY_CHARS);
    if (!content) {
        return [sanitizeContent(blog.description)];
    }

    const sentences = splitIntoSentences(content);
    const chunks: string[] = [];
    let current = '';
    for (const sentence of sentences) {
        const candidate = current ? `${current} ${sentence}` : sentence;
        if (candidate.length > MAX_CHUNK_BODY_CHARS && current) {
            chunks.push(current.trim());
            current = sentence;
        } else {
            current = candidate;
        }
    }
    if (current) {
        chunks.push(current.trim());
    }

    return chunks.length ? chunks.slice(0, MAX_BLOG_CHUNKS) : [sanitizeContent(blog.description)];
}

const formatSkills = (items: { name: string; level?: string }[]) =>
    items.map((s) => (s.level ? `${s.name} (${s.level})` : s.name)).join(', ');

/** Flattens the nested skills config into {"frontend frameworks": ["React (Expert)", …]}. */
function flattenSkills(skills: Portfolio['skills'] = {}): Record<string, string[]> {
    const out: Record<string, string[]> = {};
    for (const [group, value] of Object.entries(skills)) {
        if (Array.isArray(value)) {
            out[humanize(group)] = formatSkills(value).split(', ').filter(Boolean);
        } else {
            for (const [sub, items] of Object.entries(value ?? {})) {
                out[`${humanize(group)} ${humanize(sub)}`] = formatSkills(items).split(', ').filter(Boolean);
            }
        }
    }
    return out;
}

/**
 * Converts /api/chat-context into embedding chunks. Ids are derived from
 * content identity (slug, company, project name), not array position, so a
 * new post at the top of the list doesn't change every other chunk's id.
 */
export function buildChunks({ profile, portfolio, blogs }: ChatContext): Chunk[] {
    const chunks: Chunk[] = [];
    const used = new Set<string>();
    const add = (id: string, content: string, metadata: Chunk['metadata']) => {
        let unique = id;
        for (let n = 2; used.has(unique); n++) {
            unique = `${id}-${n}`;
        }
        used.add(unique);
        chunks.push({ id: unique, content: sanitizeContent(content, MAX_CHUNK_CHARS), metadata });
    };

    add('info-general', `${profile.name} is a ${profile.role} based in ${homeLocation}. ${profile.summary}`, { type: 'general' });
    add('info-about', `About ${profile.name}: ${profile.about}`, { type: 'about' });

    const experience = portfolio.experience.slice(0, MAX_SEEDED_ITEMS);
    add('info-experience-summary',
        `Dival Sehgal has worked at ${experience.length} companies: ${experience.map((e) => `${e.company} (${e.role}, ${e.period})`).join('; ')}.`,
        { type: 'experience_summary' });
    experience.forEach((e) => {
        add(`exp-${idPart(`${e.company}-${e.role}`)}`,
            `At ${e.company}, Dival served as ${e.role} from ${e.period}. Highlights: ${e.description.map((d) => d.text).join(' ')} Tech Stack: ${e.techStack?.join(', ') ?? 'n/a'}.`,
            { type: 'experience', company: e.company });
    });

    portfolio.projects.slice(0, MAX_SEEDED_ITEMS).forEach((p) => {
        const links = [p.link && `Live: ${p.link}`, p.repo && `Source: ${p.repo}`].filter(Boolean).join('. ');
        const url = p.link ?? p.repo;
        add(`proj-${idPart(p.name)}`,
            `Project ${p.name}: ${p.description}. Technologies used: ${p.techStack?.join(', ') ?? 'n/a'}.${links ? ` ${links}.` : ''}`,
            { type: 'project', title: p.name, ...(url ? { url } : {}) });
    });

    const skills = flattenSkills(portfolio.skills);
    const skillLines = Object.entries(skills).map(([group, items]) => `${group}: ${items.join(', ')}`);
    if (skillLines.length) {
        // One chunk per group keeps "does he know X?" matches precise; the overview answers "what are his skills?".
        add('skills-overview', `Dival Sehgal's skills by area. ${skillLines.join('. ')}.`, { type: 'skills' });
        Object.entries(skills).forEach(([group, items]) => {
            add(`skills-${idPart(group)}`, `Dival Sehgal's ${group} skills: ${items.join(', ')}.`, { type: 'skills', group });
        });
    }

    blogs.slice(0, MAX_SEEDED_ITEMS).forEach((b) => {
        const title = sanitizeContent(b.title, MAX_TITLE_CHARS);
        const url = `/blogs/${sanitizeContent(b.slug, MAX_TITLE_CHARS)}`;
        chunkBlogContent(b).forEach((content, chunkIndex) => {
            add(`blog-${idPart(b.slug)}-${chunkIndex}`,
                `Blog Post: ${title}. Summary: ${sanitizeContent(b.description, MAX_SUMMARY_CHARS)}. Content excerpt: ${content}. Published on: ${sanitizeContent(b.date, MAX_DATE_CHARS)}. URL: ${url}`,
                { type: 'blog', title, url, slug: b.slug, chunk: chunkIndex });
        });
    });

    const contactBits = [
        portfolio.contact?.email && `Email ${profile.name} at ${portfolio.contact.email}.`,
        portfolio.socials?.length && `Profiles: ${portfolio.socials.map((s) => `${s.label} (${s.href})`).join(', ')}.`,
        portfolio.resumeUrl && `Resume: ${portfolio.resumeUrl}.`,
        profile.contactIntro,
        'Visitors can also ask this assistant to forward a message to Dival.',
    ].filter(Boolean);
    add('info-contact', `Contact ${profile.name}. ${contactBits.join(' ')}`, { type: 'contact' });

    return chunks;
}

export function buildCatalog({ profile, portfolio, blogs }: ChatContext): Catalog {
    return {
        profile: { name: profile.name, role: profile.role, summary: profile.summary, location: homeLocation },
        experience: portfolio.experience.map(({ company, role, period }) => ({ company, role, period })),
        projects: portfolio.projects.map(({ name, description, techStack, link, repo }) => ({ name, description, techStack: techStack ?? [], link, repo })),
        skills: flattenSkills(portfolio.skills),
        blogs: blogs.slice(0, MAX_SEEDED_ITEMS).map((b) => ({ title: b.title, slug: b.slug, date: b.date, description: b.description, url: `${SITE_URL}/blogs/${b.slug}` })),
        contact: portfolio.contact,
        resumeUrl: portfolio.resumeUrl,
        socials: (portfolio.socials ?? []).map(({ label, href }) => ({ label, href })),
        updatedAt: new Date().toISOString(),
    };
}
