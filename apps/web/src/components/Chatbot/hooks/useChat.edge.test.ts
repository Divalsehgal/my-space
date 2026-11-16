import { act, renderHook } from '@testing-library/react';
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
  return { ok: true, json: async () => body } as unknown as Response;
}

describe('useChat (edge cases)', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('does not log aborted history requests', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    globalThis.fetch = jest
      .fn()
      .mockRejectedValue(new DOMException('aborted', 'AbortError')) as unknown as typeof fetch;
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
        body: sseStream([
          ': ping\n',
          'data: not-json\n',
          'data: {"other":1}\n',
          'data: {"response":"A"}\n',
          'data: {"response":"B"}',
        ]),
      } as unknown as Response) as unknown as typeof fetch;

    const { result } = renderHook(() => useChat());
    await act(async () => {
      await result.current.sendMessage('Hi');
    });
    expect(result.current.messages.at(-1)).toEqual({
      role: 'assistant',
      content: 'AB',
      form: 'options',
    });
  });

  it('shows the error bubble when the stream carries no content', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ messages: [] }))
      .mockResolvedValueOnce({
        ok: true,
        body: sseStream(['data: [DONE]\n']),
      } as unknown as Response) as unknown as typeof fetch;

    const { result } = renderHook(() => useChat());
    await act(async () => {
      await result.current.sendMessage('Hi');
    });
    expect(result.current.messages.at(-1)).toEqual(
      expect.objectContaining({ role: 'assistant', isError: true }),
    );
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
      .mockImplementationOnce(() => new Promise((_resolve, reject) => (rejectChat = reject)))
      // DELETE /api/history from clearHistory
      .mockResolvedValueOnce(jsonResponse({ success: true }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useChat());
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.sendMessage('First');
    });
    expect(result.current.isTyping).toBe(true);
    expect(result.current.messages).toEqual([{ role: 'user', content: 'First' }]);

    await act(() => result.current.sendMessage('Second').then(result.current.retryLastMessage));
    expect(fetchMock).toHaveBeenCalledTimes(2);

    act(() => result.current.clearHistory());
    await act(async () => {
      rejectChat(new DOMException('aborted', 'AbortError'));
      await pending;
    });
    expect(result.current.messages).toEqual([]);
    expect(result.current.isTyping).toBe(false);
    expect(fetchMock).toHaveBeenLastCalledWith(expect.stringMatching(/\/api\/history$/), {
      method: 'DELETE',
      credentials: 'include',
    });
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('shows suggestions after a completed reply and supports an explicit help request', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ messages: [] }))
      .mockResolvedValueOnce({
        ok: true,
        body: sseStream(['data: {"response":"Answer"}\n\n']),
      } as unknown as Response);
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('Question');
    });
    expect(result.current.messages.at(-1)).toMatchObject({
      role: 'assistant',
      content: 'Answer',
      form: 'options',
    });

    await act(async () => {
      await result.current.sendMessage('help');
    });
    expect(result.current.messages.find(message => message.content === 'Answer')).not.toHaveProperty('form');
    expect(result.current.messages.at(-1)).toMatchObject({ role: 'assistant', form: 'options' });
    expect(result.current.messages.at(-2)).toMatchObject({ role: 'user', content: 'help' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
