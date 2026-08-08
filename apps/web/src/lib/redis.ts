import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * Whether Upstash Redis credentials are present in the environment.
 *
 * When this is `false` every view-count / analytics read & write silently
 * degrades to a no-op (returning 0). This is the single most common reason
 * "blog view counts don't increase": the env vars simply aren't set in the
 * current environment (local `.env`, Vercel project settings, etc.).
 */
export const isRedisConfigured = Boolean(url && token);

if (!isRedisConfigured && process.env.NODE_ENV !== 'test') {
  // Surface the misconfiguration loudly instead of silently returning 0 views.
  console.warn(
    '[redis] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set. ' +
      'Blog view counts and analytics will NOT be recorded until these ' +
      'environment variables are configured.',
  );
}

// Initialize the Redis client with the (possibly empty) credentials.
// The Upstash REST client does not throw at construction time; individual
// commands fail and are caught by the callers, which degrade gracefully.
export const redis = new Redis({
  url: url ?? '',
  token: token ?? '',
});
