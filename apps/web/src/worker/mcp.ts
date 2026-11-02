import { Catalog, Env } from "./types";
import { search } from "./retrieval";
import { CATALOG_KEY, getCorsHeaders } from "./seed";

/**
 * Read-only MCP server (Streamable HTTP, stateless JSON responses) at `/mcp`,
 * so external agents (a recruiter's Claude, an IDE) can query the portfolio
 * over the same Vectorize index and catalog the chat uses.
 *
 * Deliberately no side-effecting tool: contacting Dival stays behind the chat's
 * confirm-then-send flow and the site's form.
 */

const SERVER_INFO = { name: 'dival-portfolio', version: '1.0.0' };
const SUPPORTED_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];
const MAX_QUERY_CHARS = 500;
const MAX_RESULTS = 8;
const CATALOG_CACHE_SECONDS = 300;
const DEFAULT_RESULTS = 5;
const DEFAULT_POSTS = 20;
const MAX_POSTS = 50;
const MAX_BATCH = 10;
// JSON-RPC 2.0 error codes.
const PARSE_ERROR = -32700;
const INVALID_REQUEST = -32600;
const METHOD_NOT_FOUND = -32601;
const INVALID_PARAMS = -32602;

interface JsonRpcRequest {
    jsonrpc?: string;
    id?: string | number | null;
    method?: string;
    params?: { name?: string; arguments?: Record<string, unknown>; protocolVersion?: string };
}

const TOOLS = [
    {
        name: 'search_portfolio',
        description: "Semantic search over Dival Sehgal's experience, projects, skills, contact info and blog posts. Returns the most relevant passages with their source.",
        inputSchema: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Natural-language question or keywords', maxLength: MAX_QUERY_CHARS },
                limit: { type: 'integer', minimum: 1, maximum: MAX_RESULTS, default: 5 },
            },
            required: ['query'],
        },
        annotations: { readOnlyHint: true, openWorldHint: false },
    },
    {
        name: 'get_profile',
        description: "Dival Sehgal's profile: role, summary, location, work history, skills by area, projects, contact email and social links.",
        inputSchema: { type: 'object', properties: {} },
        annotations: { readOnlyHint: true, openWorldHint: false },
    },
    {
        name: 'list_blog_posts',
        description: "Dival Sehgal's published blog posts, newest first, with title, date, description and URL.",
        inputSchema: {
            type: 'object',
            properties: { limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 } },
        },
        annotations: { readOnlyHint: true, openWorldHint: false },
    },
] as const;

export async function readCatalog(env: Env): Promise<Catalog | null> {
    try {
        return await env.CHAT_SESSIONS.get(CATALOG_KEY, { type: 'json', cacheTtl: CATALOG_CACHE_SECONDS }) as Catalog | null;
    } catch {
        return null;
    }
}

const clampInt = (value: unknown, fallback: number, max: number) =>
    Math.min(max, Math.max(1, Number.isInteger(value) ? value as number : fallback));

const text = (value: unknown, isError = false) => ({
    content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }],
    ...(isError ? { isError: true } : {}),
});

export async function callTool(env: Env, name: string | undefined, args: Record<string, unknown> = {}) {
    switch (name) {
        case 'search_portfolio': {
            const query = typeof args.query === 'string' ? args.query.trim().slice(0, MAX_QUERY_CHARS) : '';
            if (!query) {
                return text('`query` is required.', true);
            }
            const { matches } = await search(env, query, clampInt(args.limit, DEFAULT_RESULTS, MAX_RESULTS));
            return text(matches.length
                ? matches.map((m) => ({ score: m.score, type: m.metadata?.type, source: m.metadata?.url, text: m.metadata?.text }))
                : 'No relevant portfolio content found.');
        }
        case 'get_profile': {
            const catalog = await readCatalog(env);
            if (!catalog) {
                return text('Profile is not indexed yet.', true);
            }
            const { profile, experience, skills, projects, contact, socials } = catalog;
            return text({ ...profile, experience, skills, projects, contact, socials });
        }
        case 'list_blog_posts': {
            const catalog = await readCatalog(env);
            return catalog ? text(catalog.blogs.slice(0, clampInt(args.limit, DEFAULT_POSTS, MAX_POSTS))) : text('Blog index is not available yet.', true);
        }
        default:
            return undefined;
    }
}

const rpcResult = (id: JsonRpcRequest['id'], result: unknown) => ({ jsonrpc: '2.0', id: id ?? null, result });
const rpcError = (id: JsonRpcRequest['id'], code: number, message: string) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });

const METHODS: Record<string, (env: Env, msg: JsonRpcRequest) => Promise<unknown> | unknown> = {
    initialize: (_env, msg) => {
        const requested = msg.params?.protocolVersion;
        return rpcResult(msg.id, {
            protocolVersion: requested && SUPPORTED_VERSIONS.includes(requested) ? requested : SUPPORTED_VERSIONS[0],
            capabilities: { tools: { listChanged: false } },
            serverInfo: SERVER_INFO,
            instructions: "Read-only access to Dival Sehgal's public portfolio and blog. Use search_portfolio for questions, get_profile for a structured overview, list_blog_posts for writing.",
        });
    },
    ping: (_env, msg) => rpcResult(msg.id, {}),
    'tools/list': (_env, msg) => rpcResult(msg.id, { tools: TOOLS }),
    'tools/call': async (env, msg) => {
        const result = await callTool(env, msg.params?.name, msg.params?.arguments);
        return result ? rpcResult(msg.id, result) : rpcError(msg.id, INVALID_PARAMS, `Unknown tool: ${msg.params?.name}`);
    },
};

function handleOne(env: Env, msg: JsonRpcRequest): Promise<unknown> | unknown {
    if (msg?.jsonrpc !== '2.0' || typeof msg.method !== 'string') {
        return rpcError(msg?.id, INVALID_REQUEST, 'Invalid Request');
    }
    // Notifications (no id) get no response body.
    if (msg.id === undefined) {
        return undefined;
    }
    const method = Object.hasOwn(METHODS, msg.method) ? METHODS[msg.method] : undefined;
    return method ? method(env, msg) : rpcError(msg.id, METHOD_NOT_FOUND, `Method not found: ${msg.method}`);
}

export async function mcp(req: Request, env: Env): Promise<Response> {
    const headers = { 'Content-Type': 'application/json', ...getCorsHeaders(req) };
    // Stateless server: no server-initiated stream (GET) and no sessions to end (DELETE).
    if (req.method !== 'POST') {
        return new Response(null, { status: 405, headers: { ...headers, Allow: 'POST' } });
    }
    let body: JsonRpcRequest | JsonRpcRequest[];
    try {
        body = await req.json() as JsonRpcRequest | JsonRpcRequest[];
    } catch {
        return new Response(JSON.stringify(rpcError(null, PARSE_ERROR, 'Parse error')), { status: 400, headers });
    }
    const batch = Array.isArray(body) ? body.slice(0, MAX_BATCH) : [body];
    const responses = (await Promise.all(batch.map((m) => handleOne(env, m)))).filter((r) => r !== undefined);
    if (!responses.length) {
        return new Response(null, { status: 202, headers });
    }
    return new Response(JSON.stringify(Array.isArray(body) ? responses : responses[0]), { headers });
}
