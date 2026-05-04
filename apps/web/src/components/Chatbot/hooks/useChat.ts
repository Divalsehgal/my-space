import { useState, useEffect, useCallback } from 'react';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:8787' 
  : 'https://ai-chatbot-widget.sehgaldival.workers.dev';

function parseChunk(data: string): string | null {
  try {
    const parsed = JSON.parse(data);
    return parsed.response || null;
  } catch {
    return null;
  }
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const fetchHistory = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

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
        body: JSON.stringify({ message: content }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Chat request failed');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      const decoder = new TextDecoder();
      let assistantContent = '';
      
      // Add empty assistant message to be updated
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) {
            continue;
          }
          const data = line.slice(6);
          if (data === '[DONE]') {
            continue;
          }

          const part = parseChunk(data);
          if (part) {
            assistantContent += part;
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
              return updated;
            });
          }
        }
      }
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
