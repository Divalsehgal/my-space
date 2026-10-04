'use client';

import { useBlogViews } from '@/hooks/useBlogViews';
import Spinner from '@dival-sehgal/ui/spinner';
import Tooltip from '@dival-sehgal/ui/tooltip';
import { InfoIcon, VisibilityIcon } from '@dival-sehgal/ui/icons';
import styles from './styles.module.scss';
import { useLocale, useT } from "@/i18n/client";

interface BlogViewTrackerProps {
  slug: string;
}

/**
 * BlogViewTracker — Client component that:
 * 1. Fires a POST to /api/blogs/[slug]/view once the user has actively
 *    read the article for 30 seconds (uses IntersectionObserver + Page Visibility API).
 * 2. Displays the current total view count fetched from the same API (GET).
 *
 * Drop this anywhere inside a blog post page.
 */
export default function BlogViewTracker({ slug }: BlogViewTrackerProps) {
  const t = useT();
  const locale = useLocale();
  const { views } = useBlogViews(slug);

  return (
    <div className={styles.views} aria-live="polite">
      <VisibilityIcon fontSize="small" />
      {views === null ? (
        <Spinner size={14} aria-label={t("blog.viewsLoading")} />
      ) : (
        <span className={styles['views__count']}>
          {t.plural("views.count", views, { formatted: views.toLocaleString(locale) })}
        </span>
      )}
      <Tooltip
        side="bottom"
        title={t("views.hint")}
      >
        <button type="button" className={styles['views__info']} aria-label={t("views.howCalculated")}>
          <InfoIcon fontSize="small" />
        </button>
      </Tooltip>
    </div>
  );
}
