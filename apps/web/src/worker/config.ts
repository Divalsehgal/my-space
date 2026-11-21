/** Deployment-level settings: where the site lives, who may call the Worker, and which models it runs. */

export const SITE_URL = 'https://divalsehgal.vercel.app';
export const HOME_LOCATION = 'Bengaluru, India';

/** Browser origins allowed to call the Worker with credentials; the first is the default. */
export const ALLOWED_ORIGINS = [
    SITE_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8787',
    'http://127.0.0.1:8787',
];

export const CHAT_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
export const EMBEDDING_MODEL = '@cf/baai/bge-base-en-v1.5';
export const GENERATION_OPTIONS = { max_tokens: 500, temperature: 0.35, repetition_penalty: 1.05, frequency_penalty: 0.2 };
