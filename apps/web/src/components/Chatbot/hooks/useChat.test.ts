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
      isError: true,
    });
    consoleError.mockRestore();
  });

  it('retries the last user message without duplicating it', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ messages: [] })) // history on mount
      .mockResolvedValueOnce({ ok: false, status: 500 } as Response) // failed send
      .mockResolvedValueOnce({
        ok: true,
        body: sseStream(['data: {"response":"Hi there"}\n\ndata: [DONE]\n\n']),
      } as unknown as Response); // successful retry
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useChat());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.sendMessage('Hi');
    });
    expect(result.current.messages).toEqual([
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Sorry, I ran into a problem. Please try again.', isError: true },
    ]);

    await act(async () => {
      await result.current.retryLastMessage();
    });

    expect(result.current.messages).toEqual([
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hi there' },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
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

  it('ignores failed, malformed or empty history responses', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const empty = [null, 'text', { role: 'assistant', content: '   ' }];
    const responses = [{ ok: false } as Response, jsonResponse({ messages: 'nope' }), jsonResponse({ messages: empty })];
    for (const response of responses) {
      globalThis.fetch = jest.fn(async () => response) as unknown as typeof fetch;
      const { result } = renderHook(() => useChat());
      await act(() => Promise.resolve());
      expect(result.current.messages).toEqual([]);
    }

    globalThis.fetch = jest.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;
    renderHook(() => useChat());
    await waitFor(() => expect(consoleError).toHaveBeenCalledWith('Failed to fetch chat history:', expect.any(Error)));
  });

  it('does not log aborted history requests', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    globalThis.fetch = jest.fn().mockRejectedValue(new DOMException('aborted', 'AbortError')) as unknown as typeof fetch;
    renderHook(() => useChat());
    await act(() => Promise.resolve());
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('skips non-data lines and bad JSON, and flushes a trailing unterminated line', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ messages: [] }))
      .mockResolvedValueOnce({
        ok: true,
        body: sseStream([': ping\n', 'data: not-json\n', 'data: {"other":1}\n', 'data: {"response":"A"}\n', 'data: {"response":"B"}']),
      } as unknown as Response) as unknown as typeof fetch;

    const { result } = renderHook(() => useChat());
    await act(async () => {
      await result.current.sendMessage('Hi');
    });
    expect(result.current.messages.at(-1)).toEqual({ role: 'assistant', content: 'AB' });
  });

  it('shows the error bubble when the stream carries no content', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ messages: [] }))
      .mockResolvedValueOnce({ ok: true, body: sseStream(['data: [DONE]\n']) } as unknown as Response) as unknown as typeof fetch;

    const { result } = renderHook(() => useChat());
    await act(async () => {
      await result.current.sendMessage('Hi');
    });
    expect(result.current.messages.at(-1)).toEqual(expect.objectContaining({ role: 'assistant', isError: true }));
  });

  it('ignores blank messages and retries with no prior user message', async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse({ messages: [] }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const { result } = renderHook(() => useChat());
    await act(async () => {
      await result.current.sendMessage('   ');
      await result.current.retryLastMessage();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1); // history only
    expect(result.current.messages).toEqual([]);
  });

  it('ignores sends and retries while a reply is pending, and stays silent when cleared mid-request', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    let rejectChat!: (error: unknown) => void;
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ messages: [] }))
      .mockImplementationOnce(() => new Promise((_resolve, reject) => (rejectChat = reject)));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useChat());
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.sendMessage('First');
    });
    expect(result.current.isTyping).toBe(true);

    await act(() => result.current.sendMessage('Second').then(result.current.retryLastMessage));
    expect(fetchMock).toHaveBeenCalledTimes(2);

    act(() => result.current.clearHistory());
    await act(async () => {
      rejectChat(new DOMException('aborted', 'AbortError'));
      await pending;
    });
    expect(result.current.messages).toEqual([]);
    expect(result.current.isTyping).toBe(false);
    expect(consoleError).not.toHaveBeenCalled();
  });
});
