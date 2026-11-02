import { useCallback, useEffect, useRef, useState } from 'react';
import { useT } from '@/i18n/client';

/** Server-sent events prefix each payload line with this. */
const SSE_DATA_PREFIX = 'data: ';

export interface MessageSource {
  title: string;
  url: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  isError?: boolean;
  sources?: MessageSource[];
}

const BASE_URL = process.env.NEXT_PUBLIC_CHATBOT_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:8787'
    : 'https://ai-chatbot-widget.sehgaldival.workers.dev');


function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function isDisplayableMessage(value: unknown): value is Message {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<Message>;
  return (
    (candidate.role === 'user' || candidate.role === 'assistant') &&
    typeof candidate.content === 'string' &&
    candidate.content.trim().length > 0
  );
}

function isSource(value: unknown): value is MessageSource {
  const candidate = value as Partial<MessageSource> | null;
  return typeof candidate?.title === 'string' && typeof candidate.url === 'string';
}

/** One SSE payload: a text delta, a full replacement (guardrail / contact result), or source links. */
function parseEvent(data: string): { response?: string; replace?: string; sources?: MessageSource[] } | null {
  try {
    const parsed = JSON.parse(data) as { response?: unknown; replace?: unknown; sources?: unknown };
    return {
      response: typeof parsed.response === 'string' ? parsed.response : undefined,
      replace: typeof parsed.replace === 'string' ? parsed.replace : undefined,
      sources: Array.isArray(parsed.sources) ? parsed.sources.filter(isSource) : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Consumes the SSE stream. The assistant bubble is created lazily on the first
 * token so the UI shows a typing indicator (not an empty bubble) while waiting.
 * Returns whether any assistant content was received.
 */
async function processStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  setMessages: (fn: (prev: Message[]) => Message[]) => void
): Promise<boolean> {
  const decoder = new TextDecoder();
  let reply: Message = { role: 'assistant', content: '' };
  let buffer = '';
  let started = false;

  const commit = (next: Message) => {
    reply = next;
    if (started) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = next;
        return updated;
      });
    } else {
      // First token: append a new assistant bubble. Decide push-vs-replace
      // synchronously so the deferred state updater never overwrites the
      // preceding user message.
      started = true;
      setMessages(prev => [...prev, next]);
    }
  };

  const consumeLine = (line: string) => {
    if (!line.startsWith(SSE_DATA_PREFIX)) {
      return;
    }
    const data = line.slice(SSE_DATA_PREFIX.length);
    if (data === '[DONE]') {
      return;
    }
    const event = parseEvent(data);
    if (event?.replace !== undefined) {
      commit({ ...reply, content: event.replace });
    } else if (event?.response) {
      commit({ ...reply, content: reply.content + event.response });
    }
    if (event?.sources?.length && started) {
      commit({ ...reply, sources: event.sources });
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    // Keep the last, possibly-incomplete line buffered for the next chunk.
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      consumeLine(line);
    }
  }

  if (buffer) {
    consumeLine(buffer);
  }

  return started;
}

export function useChat() {
  const t = useT();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchHistory = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/history`, {
          credentials: 'include',
          signal: controller.signal,
        });
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as { messages?: unknown };
        if (Array.isArray(data.messages)) {
          const valid = data.messages.filter(isDisplayableMessage).map(({ role, content, sources }) => ({
            role,
            content,
            ...(Array.isArray(sources) ? { sources: sources.filter(isSource) } : {}),
          }));
          if (valid.length) {
            setMessages(valid);
          }
        }
      } catch (error) {
        if (!isAbortError(error)) {
          console.error('Failed to fetch chat history:', error);
        }
      }
    };

    // fetchHistory handles its own errors; the catch only keeps the promise from floating.
    fetchHistory().catch(() => undefined);
    return () => controller.abort();
  }, []);

  const requestReply = useCallback(async (text: string) => {
    // Cancel any in-flight request before starting a new one.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsTyping(true);

    try {
      const response = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          pagePath: globalThis.location?.pathname || '/',
        }),
        credentials: 'include',
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Chat request failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const received = await processStream(reader, setMessages);

      if (!received) {
        setMessages(prev => [...prev, { role: 'assistant', content: t('chat.error'), isError: true }]);
      }
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: t('chat.error'), isError: true }]);
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setIsTyping(false);
      }
    }
  }, [t]);

  const sendMessage = useCallback(
    async (content: string) => {
      const text = content.trim();
      if (!text || isTyping) {
        return;
      }

      setMessages(prev => [...prev, { role: 'user', content: text }]);
      await requestReply(text);
    },
    [isTyping, requestReply]
  );

  // Re-sends the last user message after a failed reply, without duplicating
  // the user bubble. Drops the trailing error bubble(s) so retries don't pile up.
  const retryLastMessage = useCallback(async () => {
    if (isTyping) {
      return;
    }

    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMessage) {
      return;
    }

    setMessages(prev => {
      const lastUserIndex = prev.map(m => m.role).lastIndexOf('user');
      return lastUserIndex === -1 ? prev : prev.slice(0, lastUserIndex + 1);
    });

    await requestReply(lastUserMessage.content);
  }, [isTyping, messages, requestReply]);

  // Also deletes the server-side session, so a reload doesn't bring the old chat back.
  const clearHistory = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsTyping(false);
    setMessages([]);
    fetch(`${BASE_URL}/api/history`, { method: 'DELETE', credentials: 'include' }).catch(() => undefined);
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  return {
    messages,
    isTyping,
    sendMessage,
    retryLastMessage,
    clearHistory,
  };
}
