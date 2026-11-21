import { HTTP_STATUS } from "@dival-sehgal/utils/http";
import type { Env, WorkerContext } from "./types";
import { chat } from "./routes/chat";
import { history } from "./routes/history";
import { mcp } from "./routes/mcp";
import { seed } from "./routes/seed";
import { runSeed } from "./services/seeder";
import { getCorsHeaders, json } from "./utils/http";

/**
 * Chatbot Worker entry (wrangler.json "main"): routes requests and runs the
 * scheduled reseed. Folder layout:
 *   routes/    one handler per endpoint (HTTP in, Response out)
 *   services/  RAG, LLM, KV storage, contact forwarding, re-indexing
 *   utils/     pure helpers: guardrails, SSE, chunking, HTTP responses
 *   constants/ limits, KV keys, reply copy, prompt, guardrail patterns
 *   config.ts  site URL, allowed origins, models
 */

type Handler = (req: Request, env: Env, ctx: WorkerContext) => Promise<Response>;

const routes: Record<string, Handler> = {
    '/api/chat': chat,
    '/api/history': history,
    '/mcp': mcp,
    '/api/seed': seed,
    '/api/health': async (req) => json({ status: 'ok' }, HTTP_STATUS.OK, {}, req),
};

const worker = {
    async fetch(req: Request, env: Env, ctx: WorkerContext): Promise<Response> {
        if (req.method === 'OPTIONS') {
            return new Response(null, { headers: getCorsHeaders(req) });
        }
        const pathname = new URL(req.url).pathname;
        const handler = Object.hasOwn(routes, pathname) ? routes[pathname] : undefined;
        return handler ? handler(req, env, ctx) : new Response('Not found', { status: HTTP_STATUS.NOT_FOUND });
    },

    // Cron (wrangler.json "triggers.crons"): incremental reseed with no manual
    // step or secret; `waitUntil` lets it finish after the handler returns.
    scheduled(event: { cron: string; scheduledTime: number }, env: Env, ctx: WorkerContext): void {
        ctx.waitUntil(
            runSeed(env)
                .then(({ count, upserted, deleted }) => console.info(`Scheduled reseed complete (${event.cron}): ${count} chunks, ${upserted} upserted, ${deleted} deleted`))
                .catch((err) => console.error('Scheduled reseed failed:', err))
        );
    }
};

export default worker;
