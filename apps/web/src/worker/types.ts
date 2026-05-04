export interface KVNamespace {
    get(key: string, options?: { type: 'text' | 'json' | 'arrayBuffer' | 'stream' }): Promise<string | unknown>;
    put(key: string, value: string | ArrayBuffer | ArrayBufferView | ReadableStream, options?: { expirationTtl?: number }): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{ keys: { name: string; expiration?: number; metadata?: unknown }[]; list_complete: boolean; cursor?: string }>;
}

export interface Env {
    AI: { run: (model: string, options: unknown) => Promise<unknown> };
    VECTORIZE: { 
        upsert: (vecs: unknown[]) => Promise<void>;
        query: (vector: number[], options: unknown) => Promise<{ matches: unknown[] }>;
    };
    CHAT_SESSIONS: KVNamespace;
}

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
}

export interface ChatSession {
    id: string;
    messages: ChatMessage[];
    createdAt: number;
    updatedAt: number;
}
