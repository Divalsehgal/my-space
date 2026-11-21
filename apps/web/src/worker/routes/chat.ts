import { HTTP_STATUS } from "@dival-sehgal/utils/http";
import { RECENT_TURNS_FOR_CONTEXT } from "../constants/limits";
import { FALLBACK_REPLY, OFF_TOPIC_REPLY, PRIVATE_DATA_REPLY, RATE_LIMIT_REPLY } from "../constants/replies";
import type { ChatSession, ChatSource, Env, ModelMessage, Retrieval, WorkerContext } from "../types";
import { buildModelMessages, runCompletion, streamCompletion } from "../services/llm";
import { faq } from "../services/rag";
import { postProcessReply } from "../services/reply";
import { isRateLimited, loadSession, readCatalog, saveSession, sessionCookie } from "../services/storage";
import {
    hasPortfolioTerm,
    isInPortfolioScope,
    normalizeMessage,
    sanitizeActiveBlogPath,
    stripContactToken,
    validateMessage,
} from "../utils/guards";
import { json, methodNotAllowed, sseHeaders, staticChatResponse } from "../utils/http";
import { pipeGuarded, readTokens, sseEvent, SSE_DONE } from "../utils/stream";

interface Turn {
    sess: ChatSession;
    msgs: ModelMessage[];
    retrieval: Retrieval;
}

/** One structured log line per chat turn (Workers observability); replaces a KV write per request. */
function logTurn(fields: Record<string, unknown>) {
    console.info(JSON.stringify({ event: 'chat_turn', ...fields }));
}

/**
 * Streams the model's answer through the output guardrails into `writable`,
 * then sends the final correction (if any), sources and DONE, and saves the turn.
 */
async function streamAnswer(req: Request, env: Env, { sess, msgs, retrieval }: Turn, writable: WritableStream<Uint8Array>) {
    const writer = writable.getWriter();
    // The visitor may close the tab mid-answer; keep generating so the turn is still saved.
    const write = (chunk: Uint8Array) => { writer.write(chunk).catch(() => undefined); };
    const started = Date.now();
    let final = FALLBACK_REPLY;
    let sources: ChatSource[] = [];
    try {
        const upstream = await streamCompletion(env, msgs);
        const piped = await pipeGuarded(readTokens(upstream), write, PRIVATE_DATA_REPLY);
        if (piped.leaked) {
            final = PRIVATE_DATA_REPLY;
        } else {
            // An empty stream (seen on some runtimes) falls back to one buffered completion.
            const raw = piped.raw.trim() ? piped.raw : await runCompletion(env, msgs);
            final = await postProcessReply(req, env, raw, sess);
            if (final !== piped.shown.trim()) {
                write(sseEvent({ replace: final }));
            }
            const answeredFromFacts = final === stripContactToken(raw).cleaned && final !== FALLBACK_REPLY;
            sources = answeredFromFacts ? retrieval.sources : [];
        }
    } catch (error) {
        console.error('AI stream error:', error);
        final = FALLBACK_REPLY;
        write(sseEvent({ replace: final }));
    }
    if (sources.length) {
        write(sseEvent({ sources }));
    }
    write(SSE_DONE);
    writer.close().catch(() => undefined);

    sess.messages.push({ role: 'assistant', content: final, timestamp: Date.now(), ...(sources.length ? { sources } : {}) });
    await saveSession(env, sess);
    logTurn({ outcome: 'answered', topScore: retrieval.topScore, ms: Date.now() - started, chars: final.length, fallback: final === FALLBACK_REPLY });
}

/** POST /api/chat { message, pagePath? } → SSE answer (see utils/stream.ts for the event contract). */
export async function chat(req: Request, env: Env, ctx: WorkerContext): Promise<Response> {
    if (req.method !== 'POST') {
        return methodNotAllowed(req);
    }
    // A JSON content type forces a CORS preflight, so other sites can't post into a visitor's session with a plain form/fetch.
    if (!req.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) {
        return json({ error: 'Content-Type must be application/json' }, HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE, {}, req);
    }
    const payload = await req.json().then((body) => (body && typeof body === 'object' ? body : undefined), () => undefined) as { message?: unknown; pagePath?: unknown } | undefined;
    if (!payload) {
        return json({ error: 'Invalid JSON body' }, HTTP_STATUS.BAD_REQUEST, {}, req);
    }

    const message = typeof payload.message === 'string' ? payload.message.trim() : '';
    if (!message) {
        return json({ error: 'Message required' }, HTTP_STATUS.BAD_REQUEST, {}, req);
    }

    const validation = validateMessage(message);
    if (!validation.valid) {
        logTurn({ outcome: 'blocked' });
        return staticChatResponse(req, validation.reason || OFF_TOPIC_REPLY);
    }

    if (await isRateLimited(req, env, 'chat')) {
        logTurn({ outcome: 'rate_limited' });
        return staticChatResponse(req, RATE_LIMIT_REPLY);
    }

    const { sess, isNew } = await loadSession(req, env);
    const cookieHeader: Record<string, string> = isNew ? { 'Set-Cookie': sessionCookie(req, sess.id) } : {};

    const priorTurns = sess.messages.slice(-RECENT_TURNS_FOR_CONTEXT);
    sess.messages.push({ role: 'user', content: message, timestamp: Date.now() });
    const activeBlogPath = sanitizeActiveBlogPath(typeof payload.pagePath === 'string' ? payload.pagePath : undefined);

    const hasRecentPortfolioConversation = priorTurns.some((item) => hasPortfolioTerm(normalizeMessage(item.content)));
    // Retrieval runs before the scope gate: a strong match against our own index
    // admits questions phrased without any scope word ("Is Python on the list?").
    const [retrieval, catalog] = await Promise.all([
        faq(env, message, priorTurns, activeBlogPath),
        readCatalog(env),
    ]);
    if (!isInPortfolioScope(message, hasRecentPortfolioConversation, activeBlogPath, retrieval.topScore)) {
        sess.messages.push({ role: 'assistant', content: OFF_TOPIC_REPLY, timestamp: Date.now() });
        await saveSession(env, sess);
        logTurn({ outcome: 'off_topic', topScore: retrieval.topScore });
        return staticChatResponse(req, OFF_TOPIC_REPLY, cookieHeader);
    }

    const msgs = buildModelMessages(sess.messages, catalog, retrieval.context);
    const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
    ctx.waitUntil(streamAnswer(req, env, { sess, msgs, retrieval }, writable));
    return new Response(readable, { headers: sseHeaders(req, cookieHeader) });
}
