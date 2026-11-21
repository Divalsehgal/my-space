import { HTTP_STATUS } from "@dival-sehgal/utils/http";
import { ALLOWED_ORIGINS } from "../config";
import { staticStream } from "./stream";

/** Response helpers shared by every route: CORS, JSON and SSE. */

export const getCorsHeaders = (req: Request) => {
    const origin = req.headers.get('Origin');
    const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Mcp-Protocol-Version, Mcp-Session-Id',
        'Vary': 'Origin',
    };
};

export const json = (data: unknown, status: number, headers: Record<string, string>, req: Request) =>
    new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(req), ...headers },
    });

export const methodNotAllowed = (req: Request) =>
    new Response('Method not allowed', { status: HTTP_STATUS.METHOD_NOT_ALLOWED, headers: getCorsHeaders(req) });

export const sseHeaders = (req: Request, extra: Record<string, string> = {}) => ({
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'X-Accel-Buffering': 'no',
    ...getCorsHeaders(req),
    ...extra
});

/** A complete, model-free chat reply (refusal, rate limit) in the same SSE contract as a streamed one. */
export const staticChatResponse = (req: Request, text: string, headers: Record<string, string> = {}) =>
    new Response(staticStream(text), { headers: sseHeaders(req, headers) });

export function describeError(err: unknown): string {
    if (err instanceof Error) {
        return err.message;
    }
    return typeof err === 'string' ? err : JSON.stringify(err) ?? 'Unknown error';
}
