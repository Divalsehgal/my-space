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

describe('useChat', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('loads and filters chat history', async () => {
    globalThis.fetch = jest.fn(async () =>
      jsonResponse({
        messages: [
          { role: 'user', content: 'Hi' },
          { role: 'assistant', content: 'Hello' },
          { role: 'assistant', content: '' }, // dropped
          { role: 'system', content: 'internal' }, // dropped
          { role: 'user' }, // dropped (no content)
        ],
      }),
    ) as unknown as typeof fetch;

    const { result } = renderHook(() => useChat());

    await waitFor(() => expect(result.current.messages).toHaveLength(2));
    expect(result.current.messages).toEqual([
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello' },
    ]);
  });

  it('streams assistant tokens into a single bubble', async () => {
    const fetchMock = jest
      .fn()
      // history call on mount
      .mockResolvedValueOnce(jsonResponse({ messages: [] }))
      // chat call
      .mockResolvedValueOnce({
        ok: true,
        body: sseStream([
          'data: {"response":"Hel"}\n',
          'data: {"response":"lo"}\n\ndata: [DONE]\n\n',
        ]),
      } as unknown as Response);
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useChat());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.sendMessage('Tell me about Dival');
    });

    expect(result.current.messages).toEqual([
      { role: 'user', content: 'Tell me about Dival' },
      { role: 'assistant', content: 'Hello' },
    ]);
    expect(result.current.isTyping).toBe(false);
  });

  it('shows a fallback message when the request fails', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ messages: [] }))
      .mockResolvedValueOnce({ ok: false, status: 500 } as Response);
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useChat());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.sendMessage('Hi');
    });

    expect(result.current.messages.at(-1)).toEqual({
      role: 'assistant',
      content: 'Sorry, I ran into a problem. Please try again.',
    });
    consoleError.mockRestore();
  });

  it('clears the conversation', async () => {
    globalThis.fetch = jest.fn(async () =>
      jsonResponse({ messages: [{ role: 'user', content: 'Hi' }] }),
    ) as unknown as typeof fetch;

    const { result } = renderHook(() => useChat());
    await waitFor(() => expect(result.current.messages).toHaveLength(1));

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.messages).toHaveLength(0);
  });
});
