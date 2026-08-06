'use client';

import { useEffect, useState } from 'react';

/**
 * Fetches view counts for multiple slugs in a single API call.
 * Returns a map of slug -> view count.
 */
export function useViewCounts(slugs: string[]): Record<string, number> {
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (slugs.length === 0 || typeof fetch === 'undefined') { return; }

    const slugParam = slugs.join(',');
    let cancelled = false;

    fetch(`/api/blogs/views?slugs=${encodeURIComponent(slugParam)}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.views) {
          setViewCounts(data.views);
        }
      })
      .catch(() => {
        // Silently fail — view counts are non-critical
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugs.join(',')]);

  return viewCounts;
}
