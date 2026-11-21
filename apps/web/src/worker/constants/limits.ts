import { DAYS_PER_WEEK, HOURS_PER_DAY, MINUTES_PER_HOUR, SECONDS_PER_MINUTE } from "@dival-sehgal/utils/time";

// scripts/generate-architecture.mjs reads several of these by name (`const NAME = value;`) for the chatbot LLD.

// ---- Sessions (KV) ----
export const SESSION_TTL_SECONDS = DAYS_PER_WEEK * HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE;
export const SESSION_COOKIE = 'chatbot_session';
export const SESSION_ID_PATTERN = /^sess_[0-9a-f-]{36}$/;
/** Turns kept in KV per session; older ones are never sent to the model anyway. */
export const MAX_STORED_MESSAGES = 40;
/** Earlier turns consulted when deciding if a follow-up is still on topic. */
export const RECENT_TURNS_FOR_CONTEXT = 6;
/** Conversation turns sent to the model with each request. */
export const HISTORY_TURNS_SENT_TO_MODEL = 10;

// ---- Rate limiting (KV fallback; the binding's limit lives in wrangler.json) ----
export const RATE_LIMIT_MAX = 20;
export const RATE_LIMIT_WINDOW_SECONDS = SECONDS_PER_MINUTE;

// ---- KV keys ----
/** {id → content hash} for the vectors currently in the index. */
export const MANIFEST_KEY = 'seed:manifest';
/** The structured catalog (site index + MCP tools). */
export const CATALOG_KEY = 'catalog:v1';
export const CATALOG_CACHE_SECONDS = 300;

// ---- Input validation (RFC 5321 caps email addresses at 254 characters) ----
export const MAX_NAME_LENGTH = 120;
export const MAX_EMAIL_LENGTH = 254;
export const MAX_CONTACT_MESSAGE_LENGTH = 1000;
export const MAX_CHAT_MESSAGE_LENGTH = 500;
export const MAX_CONTACTS_PER_SESSION = 3;

// ---- Retrieval ----
/** Queries shorter than this are treated as follow-ups and enriched with the previous turn. */
export const SHORT_QUERY_CHARS = 20;
/** Vector matches below this similarity are dropped as irrelevant. */
export const MIN_RELEVANCE_SCORE = 0.65;
export const DEFAULT_TOP_K = 5;
/**
 * A question whose best vector match scores at least this is about the indexed
 * portfolio even when it uses none of the scope words ("Does he know Python?").
 * The score compares the user's own text with our own index, so retrieved text
 * still never decides scope.
 */
export const SEMANTIC_SCOPE_SCORE = 0.72;

// ---- Prompt ----
export const SITE_INDEX_LIMIT = 30;
export const ISO_DATE_LENGTH = 10;

// ---- Seeding / chunking ----
export const EMBED_BATCH_SIZE = 50;
export const UPSERT_BATCH_SIZE = 500;
/** Vectorize caps deleteByIds at 100 ids per call. */
export const DELETE_BATCH_SIZE = 100;
/** Hex characters of the SHA-256 kept per chunk; collisions only cost a skipped re-embed. */
export const HASH_CHARS = 16;
export const MAX_TITLE_CHARS = 180;
export const MAX_SUMMARY_CHARS = 320;
export const MAX_DATE_CHARS = 80;
export const MAX_CHUNK_CHARS = 1600;
export const MAX_CHUNK_BODY_CHARS = 1200;
/** Long posts (40k+ chars) are indexed in full instead of their first ~10k chars. */
export const MAX_BLOG_CHUNKS = 40;
export const MAX_SEEDED_ITEMS = 50;
/** Vectorize ids are capped at 64 bytes. */
export const MAX_ID_PART = 40;

// ---- MCP ----
export const MCP_SUPPORTED_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];
export const MCP_MAX_QUERY_CHARS = 500;
export const MCP_MAX_RESULTS = 8;
export const MCP_DEFAULT_RESULTS = 5;
export const MCP_DEFAULT_POSTS = 20;
export const MCP_MAX_POSTS = 50;
export const MCP_MAX_BATCH = 10;
