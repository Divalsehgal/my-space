export interface KVNamespace {
    get(key: string, options?: { type: 'text' | 'json' | 'arrayBuffer' | 'stream'; cacheTtl?: number }): Promise<unknown>;
    put(key: string, value: string | ArrayBuffer | ArrayBufferView | ReadableStream, options?: { expirationTtl?: number }): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{ keys: { name: string; expiration?: number; metadata?: unknown }[]; list_complete: boolean; cursor?: string }>;
}

/** Cloudflare Rate Limiting binding (atomic, per-location counters). */
export interface RateLimiter {
    limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface Env {
    AI: { run: (model: string, options: unknown) => Promise<unknown> };
    VECTORIZE: {
        upsert: (vecs: unknown[]) => Promise<void>;
        deleteByIds: (ids: string[]) => Promise<void>;
        query: (vector: number[], options: unknown) => Promise<{ matches: unknown[] }>;
    };
    CHAT_SESSIONS: KVNamespace;
    /** Optional: falls back to a best-effort KV counter when unbound (tests, old configs). */
    CHAT_RATE_LIMITER?: RateLimiter;
    CHAT_CONTEXT_URL?: string;
    CONTACT_API_URL?: string;
    SEED_SECRET?: string;
}

export interface WorkerContext {
    waitUntil: (p: Promise<unknown>) => void;
}

/** A link shown under an answer, taken from the retrieved chunks' metadata. */
export interface ChatSource {
    title: string;
    url: string;
}

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    sources?: ChatSource[];
}

export interface ChatSession {
    id: string;
    messages: ChatMessage[];
    createdAt: number;
    updatedAt: number;
    /** Contact messages forwarded from this session (abuse cap). */
    contactsSent?: number;
}

/**
 * Compact, structured copy of the knowledge base written to KV on every seed.
 * Feeds the chat's site index (list-style questions retrieval can't answer)
 * and the MCP tools, so neither has to re-fetch /api/chat-context.
 */
export interface Catalog {
    profile: { name: string; role: string; summary: string; location: string };
    experience: { company: string; role: string; period: string }[];
    projects: { name: string; description: string; techStack: string[]; link?: string; repo?: string }[];
    skills: Record<string, string[]>;
    blogs: { title: string; slug: string; date: string; description: string; url: string }[];
    contact?: { email: string };
    socials: { label: string; href: string }[];
    updatedAt: string;
}
