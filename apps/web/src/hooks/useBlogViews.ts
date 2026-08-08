'use client';

import { useEffect, useRef, useState } from 'react';
import { isOwnerMode } from '@/utils/ownerMode';

interface UseBlogViewsOptions {
  /** Minimum milliseconds the article must be visible before recording a view */
  thresholdMs?: number;
  /**
   * Intersection ratio required to consider the element "visible".
   *
   * Defaults to `0` (any pixel visible). A non-zero ratio must NOT be used with
   * the full `<article>` element: a long post is taller than the viewport, so its
   * visible ratio can never reach e.g. 0.3, leaving `isIntersecting` permanently
   * false and preventing the view from ever being recorded.
   */
  intersectionThreshold?: number;
}

interface UseBlogViewsReturn {
  views: number | null;
  isTracked: boolean;
}

/**
 * Tracks a unique, human-verified blog post view.
 *
 * Strategy:
 * 1. Uses IntersectionObserver to detect when the article enters the viewport.
 * 2. Uses the Page Visibility API to pause the timer when the tab is backgrounded.
 * 3. Once the user has been actively reading for `thresholdMs` (default 5s), fires
 *    a POST to /api/blogs/[slug]/view.
 * 4. Uses sessionStorage to prevent re-firing on React re-renders or route re-visits
 *    within the same browser session.
 */
export function useBlogViews(
  slug: string,
  { thresholdMs = 5000, intersectionThreshold = 0 }: UseBlogViewsOptions = {}
): UseBlogViewsReturn {
  const [views, setViews] = useState<number | null>(null);
  const [isTracked, setIsTracked] = useState(false);

  // Mutable refs so we don't need them in dep arrays
  const accumulatedMs = useRef(0);
  const lastVisibleAt = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasTracked = useRef(false);
  const isIntersecting = useRef(false);
  const isPageVisible = useRef(true);

  // 1. Fetch the current view count on mount (GET)
  useEffect(() => {
    if (!slug || typeof fetch === 'undefined') { return; }

    let cancelled = false;

    fetch(`/api/blogs/${slug}/view`, { method: 'GET', cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.views !== undefined) {
          setViews(data.views);
        }
      })
      .catch(() => {
        // Silently fail — view count is non-critical
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // 2. Track view with visibility + time threshold
  useEffect(() => {
    if (!slug || typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      return;
    }

    // Owner mode: skip recording but still show counts
    const sessionKey = `blog_viewed_${slug}`;
    if (isOwnerMode() || sessionStorage.getItem(sessionKey)) {
      hasTracked.current = true;
      queueMicrotask(() => {
        setIsTracked(true);
      });
      return;
    }

    const recordView = async () => {
      if (hasTracked.current || typeof fetch === 'undefined') { return; }
      hasTracked.current = true;

      try {
        const res = await fetch(`/api/blogs/${slug}/view`, { method: 'POST', cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data?.views !== undefined) {
            setViews(data.views);
          }
          sessionStorage.setItem(sessionKey, '1');
          setIsTracked(true);
        }
      } catch {
        // Silently fail
      }
    };

    const startTimer = () => {
      if (timerRef.current) {
        return; // already ticking
      }
      const remaining = thresholdMs - accumulatedMs.current;
      lastVisibleAt.current = Date.now();
      timerRef.current = setTimeout(() => {
        accumulatedMs.current = thresholdMs; // mark as complete
        recordView();
      }, remaining);
    };

    const pauseTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (lastVisibleAt.current !== null) {
        accumulatedMs.current += Date.now() - lastVisibleAt.current;
        lastVisibleAt.current = null;
      }
    };

    const shouldBeActive = () =>
      isIntersecting.current && isPageVisible.current && !hasTracked.current;

    // Page Visibility API handler
    const handleVisibilityChange = () => {
      isPageVisible.current = document.visibilityState === 'visible';
      if (shouldBeActive()) {
        startTimer();
      } else {
        pauseTimer();
      }
    };

    // IntersectionObserver handler
    const observer = new IntersectionObserver(
      ([entry]) => {
        isIntersecting.current = entry.isIntersecting;
        if (shouldBeActive()) {
          startTimer();
        } else {
          pauseTimer();
        }
      },
      { threshold: intersectionThreshold }
    );

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Observe the article element — fall back to body if not found
    const target =
      document.querySelector('article') ?? document.documentElement;
    observer.observe(target);

    // Start immediately if already visible
    if (
      document.visibilityState === 'visible' &&
      !hasTracked.current
    ) {
      isIntersecting.current = true; // assume visible on first render
      startTimer();
    }

    return () => {
      pauseTimer();
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [slug, thresholdMs, intersectionThreshold]);

  return { views, isTracked };
}
