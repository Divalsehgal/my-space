import { Redis } from '@upstash/redis';

// Initialize the Redis client. 
// We use the UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars.
// The client will throw an error if these are not provided, which is expected
// in production to ensure we don't silently fail without analytics tracking.
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});
