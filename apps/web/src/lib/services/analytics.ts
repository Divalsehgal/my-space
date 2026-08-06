import crypto from 'crypto';
import { redis } from '../redis';

export type ViewStats = {
  total: number;
};

export type AnalyticsData = {
  total: number;
  uniqueVisitors: number;
  daily: Record<string, number>;
  monthly: Record<string, number>;
  topReferrers: { source: string; count: number }[];
  countries: { country: string; count: number }[];
};

export type PopularPost = {
  slug: string;
  views: number;
};

// Common bot patterns to filter out
const BOT_REGEX = /bot|crawler|spider|crawling|googlebot|bingbot|yandex|baiduspider|slurp|duckduckbot|teoma/i;

/**
 * Generates a SHA-256 hash from the provided inputs.
 */
function generateHash(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Gets the current date in YYYY-MM-DD format (UTC)
 */
function getDailyKeySuffix(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/**
 * Gets the current month in YYYY-MM format (UTC)
 */
function getMonthlyKeySuffix(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * Normalizes a raw referrer URL into a clean domain/source label.
 * - Strips protocol, www, and paths.
 * - Returns null for empty/self referrers.
 */
function normalizeReferrer(rawReferrer: string | null, siteHost?: string): string | null {
  if (!rawReferrer) {
    return null;
  }

  try {
    const url = new URL(rawReferrer);
    const host = url.hostname.replace(/^www\./, '');

    // Filter out self-referrals
    if (siteHost && host === siteHost.replace(/^www\./, '')) {
      return null;
    }

    return host;
  } catch {
    // If it's not a valid URL, return as-is (e.g. "android-app://...")
    return rawReferrer.length > 0 ? rawReferrer : null;
  }
}

/**
 * Records a unique view for a blog post.
 * Uses a Redis deduplication key with a 24-hour TTL.
 *
 * Also tracks:
 * - Unique visitors via HyperLogLog
 * - Referrer sources via sorted set
 * - Country/geo data via sorted set
 */
export type RecordViewParams = {
  slug: string;
  ip: string | null;
  userAgent: string | null;
  visitorId: string | null;
  referrer?: string | null;
  country?: string | null;
};

export async function recordView({
  slug,
  ip,
  userAgent,
  visitorId,
  referrer,
  country,
}: RecordViewParams): Promise<boolean> {
  // Filter out bots
  if (userAgent && BOT_REGEX.test(userAgent)) {
    return false;
  }

  // Combine available signals to create a unique fingerprint
  // If visitorId (cookie) is available, use it. Otherwise rely on IP + UA.
  const rawFingerprint = `${visitorId || 'no-cookie'}|${ip || 'no-ip'}|${userAgent || 'no-ua'}`;
  const visitorHash = generateHash(rawFingerprint);

  const dedupKey = `view:dedup:${slug}:${visitorHash}`;

  try {
    // Attempt to set the deduplication key with SET NX EX
    // TTL is 86400 seconds (24 hours)
    // Upstash's SET NX EX returns "OK" if set, or null if it already existed
    const isSet = await redis.set(dedupKey, '1', { nx: true, ex: 86400 });

    if (isSet) {
      // Key was set, so this is a unique view. Increment counters atomically.
      const dailySuffix = getDailyKeySuffix();
      const monthlySuffix = getMonthlyKeySuffix();

      const pipeline = redis.pipeline();

      // Increment total views
      pipeline.incr(`views:total:${slug}`);

      // Increment daily views
      pipeline.hincrby(`views:daily:${slug}`, dailySuffix, 1);

      // Increment monthly views
      pipeline.hincrby(`views:monthly:${slug}`, monthlySuffix, 1);

      // Track unique visitors via HyperLogLog (memory-efficient ~12KB per slug)
      pipeline.pfadd(`visitors:unique:${slug}`, visitorHash);

      // Track referrer source (sorted set — score = count)
      const normalizedReferrer = normalizeReferrer(referrer ?? null);
      if (normalizedReferrer) {
        pipeline.zincrby(`referrers:${slug}`, 1, normalizedReferrer);
      }

      // Track country/geo (sorted set — score = count)
      if (country && country !== 'unknown') {
        pipeline.zincrby(`geo:${slug}`, 1, country);
      }

      await pipeline.exec();
      return true;
    }
  } catch (error) {
    console.error('Error recording view in Redis:', error);
    // Graceful degradation: log the error but don't fail the request.
    // If Redis is down, we just don't record the view.
  }

  return false;
}

/**
 * Retrieves the total view count for a blog post.
 */
export async function getViews(slug: string): Promise<number> {
  try {
    const views = await redis.get<number>(`views:total:${slug}`);
    return views || 0;
  } catch (error) {
    console.error('Error getting views from Redis:', error);
    return 0;
  }
}

/**
 * Retrieves full analytics data for a blog post.
 * Includes total views, unique visitors, daily/monthly breakdown,
 * top referrers, and country distribution.
 */
export async function getAnalytics(slug: string): Promise<AnalyticsData> {
  try {
    const pipeline = redis.pipeline();

    // Total views
    pipeline.get(`views:total:${slug}`);
    // Unique visitors (HyperLogLog count)
    pipeline.pfcount(`visitors:unique:${slug}`);
    // Daily breakdown (full hash)
    pipeline.hgetall(`views:daily:${slug}`);
    // Monthly breakdown (full hash)
    pipeline.hgetall(`views:monthly:${slug}`);
    // Top 10 referrers (sorted set, descending)
    pipeline.zrange(`referrers:${slug}`, 0, 9, { rev: true, withScores: true });
    // Top 10 countries (sorted set, descending)
    pipeline.zrange(`geo:${slug}`, 0, 9, { rev: true, withScores: true });

    const results = await pipeline.exec();

    const total = (results[0] as number) || 0;
    const uniqueVisitors = (results[1] as number) || 0;
    const dailyRaw = (results[2] as Record<string, string>) || {};
    const monthlyRaw = (results[3] as Record<string, string>) || {};
    const referrersRaw = (results[4] as string[]) || [];
    const geoRaw = (results[5] as string[]) || [];

    // Convert daily/monthly hash values from strings to numbers
    const daily: Record<string, number> = {};
    for (const [key, val] of Object.entries(dailyRaw)) {
      daily[key] = Number(val);
    }

    const monthly: Record<string, number> = {};
    for (const [key, val] of Object.entries(monthlyRaw)) {
      monthly[key] = Number(val);
    }

    // Parse sorted set results (ZRANGE WITHSCORES returns [member, score, member, score, ...])
    const topReferrers: { source: string; count: number }[] = [];
    for (let i = 0; i < referrersRaw.length; i += 2) {
      topReferrers.push({
        source: referrersRaw[i],
        count: Number(referrersRaw[i + 1]),
      });
    }

    const countries: { country: string; count: number }[] = [];
    for (let i = 0; i < geoRaw.length; i += 2) {
      countries.push({
        country: geoRaw[i],
        count: Number(geoRaw[i + 1]),
      });
    }

    return {
      total,
      uniqueVisitors,
      daily,
      monthly,
      topReferrers,
      countries,
    };
  } catch (error) {
    console.error('Error getting analytics from Redis:', error);
    return {
      total: 0,
      uniqueVisitors: 0,
      daily: {},
      monthly: {},
      topReferrers: [],
      countries: [],
    };
  }
}

/**
 * Returns the most popular blog posts sorted by total view count.
 * Scans all `views:total:*` keys in Redis.
 */
export async function getPopularPosts(limit: number = 10): Promise<PopularPost[]> {
  try {
    // Use SCAN to find all views:total:* keys
    const keys: string[] = [];
    let cursor = 0;

    do {
      const [nextCursor, batch] = await redis.scan(cursor, {
        match: 'views:total:*',
        count: 100,
      });
      cursor = Number(nextCursor);
      keys.push(...batch);
    } while (cursor !== 0);

    if (keys.length === 0) {
      return [];
    }

    // Fetch all view counts in a pipeline
    const pipeline = redis.pipeline();
    for (const key of keys) {
      pipeline.get(key);
    }
    const counts = await pipeline.exec();

    // Pair slugs with counts and sort
    const posts: PopularPost[] = keys.map((key, i) => ({
      slug: key.replace('views:total:', ''),
      views: (counts[i] as number) || 0,
    }));

    posts.sort((a, b) => b.views - a.views);

    return posts.slice(0, limit);
  } catch (error) {
    console.error('Error getting popular posts from Redis:', error);
    return [];
  }
}
