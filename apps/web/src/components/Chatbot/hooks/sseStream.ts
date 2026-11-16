/** Server-sent events prefix each payload line with this. */
const SSE_DATA_PREFIX = 'data: ';

export interface MessageSource {
  title: string;
  url: string;
}

export interface StreamMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  isError?: boolean;
  sources?: MessageSource[];
  form?: 'contact' | 'options';
}

export function isSource(value: unknown): value is MessageSource {
  const candidate = value as Partial<MessageSource> | null;
  return typeof candidate?.title === 'string' && typeof candidate.url === 'string';
}

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
export async function processStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  setMessages: (fn: (prev: StreamMessage[]) => StreamMessage[]) => void
): Promise<boolean> {
  const decoder = new TextDecoder();
  let reply: StreamMessage = { role: 'assistant', content: '' };
  let buffer = '';
  let started = false;

  const commit = (next: StreamMessage) => {
    reply = next;
    if (started) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = next;
        return updated;
      });
    } else {
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
