import { act, renderHook, waitFor } from '@testing-library/react';
import { TextDecoder, TextEncoder } from 'util';
import { ReadableStream } from 'stream/web';
import { useChat } from './useChat';

// jsdom does not provide these Web APIs used by the streaming SSE reader.
const globalWithPolyfills = globalThis as unknown as Record<string, unknown>;
globalWithPolyfills.TextEncoder ??= TextEncoder;
globalWithPolyfills.TextDecoder ??= TextDecoder;
globalWithPolyfills.ReadableStream ??= ReadableStream;

function sseStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    json: async () => body,
  } as unknown as Response;
}

describe('useChat SSE events', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('applies replace events and attaches sources to the reply', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ messages: [] }))
      .mockResolvedValueOnce({
        ok: true,
        body: sseStream([
          'data: {"response":"Draft"}\n\n',
          'data: {"replace":"Final answer"}\n\n',
          'data: {"sources":[{"title":"Post","url":"/blogs/post"},{"bad":1}]}\n\ndata: [DONE]\n\n',
        ]),
      } as unknown as Response);
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useChat());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await act(async () => {
      await result.current.sendMessage('Tell me about Dival');
    });

    expect(result.current.messages.at(-1)).toEqual({
      role: 'assistant',
      content: 'Final answer',
      sources: [{ title: 'Post', url: '/blogs/post' }],
    });
  });
});
