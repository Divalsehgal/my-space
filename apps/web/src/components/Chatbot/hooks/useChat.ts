import { useCallback, useEffect, useRef, useState } from 'react';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_CHATBOT_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:8787'
    : 'https://ai-chatbot-widget.sehgaldival.workers.dev');

const GENERIC_ERROR = 'Sorry, I ran into a problem. Please try again.';

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

function extractResponse(data: string): string | null {
  try {
    const parsed = JSON.parse(data) as { response?: unknown };
    return typeof parsed.response === 'string' ? parsed.response : null;
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
  let assistantContent = '';
  let buffer = '';
  let started = false;

  const commit = (content: string) => {
    if (started) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content };
        return updated;
      });
    } else {
      // First token: append a new assistant bubble. Decide push-vs-replace
      // synchronously so the deferred state updater never overwrites the
      // preceding user message.
      started = true;
      setMessages(prev => [...prev, { role: 'assistant', content }]);
    }
  };

  const consumeLine = (line: string) => {
    if (!line.startsWith('data: ')) {
      return;
    }
    const data = line.slice(6);
    if (data === '[DONE]') {
      return;
    }
    const part = extractResponse(data);
    if (part) {
      assistantContent += part;
      commit(assistantContent);
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
          const valid = data.messages.filter(isDisplayableMessage);
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

    fetchHistory();
    return () => controller.abort();
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      const text = content.trim();
      if (!text || isTyping) {
        return;
      }

      // Cancel any in-flight request before starting a new one.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setMessages(prev => [...prev, { role: 'user', content: text }]);
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
          setMessages(prev => [...prev, { role: 'assistant', content: GENERIC_ERROR }]);
        }
      } catch (error) {
        if (isAbortError(error)) {
          return;
        }
        console.error('Chat error:', error);
        setMessages(prev => [...prev, { role: 'assistant', content: GENERIC_ERROR }]);
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
          setIsTyping(false);
        }
      }
    },
    [isTyping]
  );

  const clearHistory = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsTyping(false);
    setMessages([]);
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  return {
    messages,
    isTyping,
    sendMessage,
    clearHistory,
  };
}
