import { useCallback, useEffect, useRef, useState } from 'react';
import { useT } from '@/i18n/client';
import { isContactIntent } from '../ChatPanel/ChatContactForm/contactFlow';
import { isSource, processStream, type MessageSource, type StreamMessage } from './sseStream';

export type { MessageSource };

export type Message = StreamMessage;

const OPTIONS_INTENT = /^(help|options|main options|menu|\?)$/i;

export function isOptionsIntent(text: string): boolean {
  return OPTIONS_INTENT.test(text.trim());
}

type DisplayableMessage = Message & { role: 'user' | 'assistant' };

function isDisplayableMessage(value: unknown): value is DisplayableMessage {
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

function clearPreviousSuggestions(messages: Message[]): Message[] {
  return messages.map(message => {
    if (message.form !== 'options') {
      return message;
    }
    const updated = { ...message };
    delete updated.form;
    return updated;
  });
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

const BASE_URL =
  process.env.NEXT_PUBLIC_CHATBOT_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:8787'
    : 'https://ai-chatbot-widget.sehgaldival.workers.dev');

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
          const valid: Message[] = data.messages
            .filter(isDisplayableMessage)
            .map(({ role, content, sources }) => ({
              role,
              content,
              ...(Array.isArray(sources) ? { sources: sources.filter(isSource) } : {}),
            }));
          if (valid.length) {
            const lastIndex = valid.length - 1;
            if (valid[lastIndex]?.role === 'assistant') {
              valid[lastIndex] = { ...valid[lastIndex], form: 'options' };
            }
            setMessages(valid);
          }
        }
      } catch (error) {
        if (!isAbortError(error)) {
          console.error('Failed to fetch chat history:', error);
        }
      }
    };

    fetchHistory().catch(() => undefined);
    return () => controller.abort();
  }, []);

  const requestReply = useCallback(
    async (text: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsTyping(true);

      try {
        const response = await fetch(`${BASE_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, pagePath: globalThis.location?.pathname || '/' }),
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
        } else {
          setMessages(prev => {
            const lastIndex = prev.length - 1;
            const lastMessage = prev[lastIndex];
            if (lastMessage?.role !== 'assistant') {
              return prev;
            }
            const updated = [...prev];
            updated[lastIndex] = { ...lastMessage, form: 'options' };
            return updated;
          });
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
    },
    [t]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      const text = content.trim();
      if (!text || isTyping) {
        return;
      }

      if (isOptionsIntent(text)) {
        setMessages(prev => [
          ...clearPreviousSuggestions(prev),
          { role: 'user', content: text },
          { role: 'assistant', content: t('chat.emptyTitle'), form: 'options' },
        ]);
        return;
      }

      const formReply: Message[] = isContactIntent(text)
        ? [{ role: 'assistant', content: t('chat.contact.intro'), form: 'contact' }]
        : [];
      setMessages(prev => [...clearPreviousSuggestions(prev), { role: 'user', content: text }, ...formReply]);
      return formReply.length ? undefined : requestReply(text);
    },
    [isTyping, requestReply, t]
  );

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

  const clearHistory = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsTyping(false);
    setMessages([]);
    fetch(`${BASE_URL}/api/history`, { method: 'DELETE', credentials: 'include' }).catch(() => undefined);
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  return { messages, isTyping, sendMessage, retryLastMessage, clearHistory };
}
