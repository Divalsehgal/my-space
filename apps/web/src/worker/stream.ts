import { CONTACT_MARKER, responseLeakPatterns } from "./guards";
import type { ChatSource } from "./types";

/**
 * Token streaming with output guardrails. The model's text is forwarded as it
 * arrives, except:
 * - anything from a (possible) `[SUBMIT_CONTACT` marker on is held back, so the
 *   internal token never reaches the browser, even half-written;
 * - the moment a leak pattern appears, the reply is replaced and the rest dropped.
 * After the stream ends the caller may send one `replace` event with the final,
 * post-processed text (contact result, fallback), which the client swaps in.
 *
 * Client contract (one JSON object per `data:` line, then `data: [DONE]`):
 *   {"response": "<delta>"}      append text
 *   {"replace": "<full text>"}   replace the bubble's text
 *   {"sources": [{title,url}]}   links shown under the answer
 */

const encoder = new TextEncoder();
export const sseEvent = (payload: unknown) => encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
export const SSE_DONE = encoder.encode('data: [DONE]\n\n');

/** Length of `raw` that is safe to show: stops before a full or partial contact marker. */
export function visibleLength(raw: string): number {
    const marker = raw.indexOf(CONTACT_MARKER);
    if (marker !== -1) {
        return marker;
    }
    const bracket = raw.lastIndexOf('[');
    return bracket !== -1 && CONTACT_MARKER.startsWith(raw.slice(bracket)) ? bracket : raw.length;
}

export const hasLeak = (text: string) => responseLeakPatterns.some((pattern) => pattern.test(text));

/** Text of one upstream Workers AI SSE payload: OpenAI-style delta, or the legacy `response`. */
function tokenOf(data: string): string {
    try {
        const parsed = JSON.parse(data) as { response?: unknown; choices?: { delta?: { content?: unknown } }[] };
        const delta = parsed.choices?.[0]?.delta?.content;
        if (typeof delta === 'string') {
            return delta;
        }
        return typeof parsed.response === 'string' ? parsed.response : '';
    } catch {
        return '';
    }
}

const DATA_PREFIX = 'data:';
const lineToken = (line: string) => {
    const trimmed = line.trim();
    const data = trimmed.startsWith(DATA_PREFIX) ? trimmed.slice(DATA_PREFIX.length).trim() : '';
    return data && data !== '[DONE]' ? tokenOf(data) : '';
};

/** Yields text tokens from a Workers AI `stream: true` body. */
export async function* readTokens(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    try {
        while (true) {
            const { done, value } = await reader.read();
            buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
            const lines = done ? [buffer] : buffer.split('\n');
            buffer = done ? '' : lines.pop() ?? '';
            yield* lines.map(lineToken).filter(Boolean);
            if (done) {
                return;
            }
        }
    } finally {
        reader.releaseLock();
    }
}

export interface GuardedStreamResult {
    /** Everything the model produced (including any contact token). */
    raw: string;
    /** What the browser has been shown so far. */
    shown: string;
    leaked: boolean;
}

/**
 * Forwards model tokens to `write` through the output guardrails and returns
 * what was produced and shown, so the caller can decide on a final `replace`.
 */
export async function pipeGuarded(
    tokens: AsyncIterable<string>,
    write: (chunk: Uint8Array) => void,
    leakReply: string,
): Promise<GuardedStreamResult> {
    let raw = '';
    let shown = '';
    for await (const token of tokens) {
        raw += token;
        // Only the visible part: the held-back contact token itself contains "SUBMIT_CONTACT".
        const safe = raw.slice(0, visibleLength(raw));
        if (hasLeak(safe)) {
            write(sseEvent({ replace: leakReply }));
            return { raw, shown: leakReply, leaked: true };
        }
        if (safe.length > shown.length) {
            write(sseEvent({ response: safe.slice(shown.length) }));
            shown = safe;
        }
    }
    return { raw, shown, leaked: false };
}

/** A complete reply that needs no model (refusals, rate limits, errors), same contract. */
export function staticStream(text: string, sources: ChatSource[] = []): string {
    const events = [{ response: text }, ...(sources.length ? [{ sources }] : [])];
    return `${events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join('')}data: [DONE]\n\n`;
}
