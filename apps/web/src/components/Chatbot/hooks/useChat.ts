import { useState, useEffect } from 'react';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_CHATBOT_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:8787'
    : 'https://ai-chatbot-widget.sehgaldival.workers.dev');

function parseChunk(data: string): string | null {
  try {
    const parsed = JSON.parse(data);
    return parsed.response || null;
  } catch {
    return null;
  }
}

async function processStreamLine(
  line: string,
  assistantContent: string,
  setMessages: (fn: (prev: Message[]) => Message[]) => void
): Promise<string> {
  if (!line.startsWith('data: ')) {
    return assistantContent;
  }

  const data = line.slice(6);
  if (data === '[DONE]') {
    return assistantContent;
  }

  const part = parseChunk(data);
  if (!part) {
    return assistantContent;
  }

  const updatedContent = assistantContent + part;
  setMessages(prev => {
    const updated = [...prev];
    updated[updated.length - 1] = { role: 'assistant', content: updatedContent };
    return updated;
  });

  return updatedContent;
}

async function processStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  setMessages: (fn: (prev: Message[]) => Message[]) => void
): Promise<string> {
  const decoder = new TextDecoder();
  let assistantContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      assistantContent = await processStreamLine(line, assistantContent, setMessages);
    }
  }

  return assistantContent;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/history`, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          if (data.messages?.length) {
            setMessages(data.messages);
          }
        }
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
      }
    };

    fetchHistory();
  }, []);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isTyping) {
      return;
    }

    const userMessage: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, pagePath: globalThis.location?.pathname || '/' }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Chat request failed');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      await processStream(reader, setMessages);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearHistory = async () => {
    setMessages([]);
    // You could add an API call to clear history on the server if needed
  };

  return {
    messages,
    isTyping,
    sendMessage,
    clearHistory
  };
}
