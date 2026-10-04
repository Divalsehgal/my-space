import type { CSSProperties } from "react";
import Link from "next/link";
import clsx from "clsx";
import { InfoIcon as InfoOutlinedIcon } from "@dival-sehgal/ui/icons";
import Spinner from "@dival-sehgal/ui/spinner";
import ViewTransition from "@/components/ViewTransition";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { getT } from "@/i18n/server";
import type { ContentfulPost } from "@/types";
import { getRelativeTimeLabel } from "@/utils/date";
import styles from "./styles.module.scss";

/** A blog card, rendered on the server (dates, counts and copy included). */
export default function BlogCard({
  post,
  views,
  className,
  morph = false,
}: Readonly<{ post: ContentfulPost; views?: number | null; className?: string; morph?: boolean }>) {
  const t = getT();
  const locale = DEFAULT_LOCALE;
  const isUpdatedPost = Boolean(
    post.publishedAt && post.publishedAt !== post.date,
  );
  const relativeTimeLabel = getRelativeTimeLabel(
    isUpdatedPost ? post.publishedAt : post.date,
    isUpdatedPost,
    t,
    locale,
  );
  const isViewsLoading = views === null || views === undefined;

  return (
    <Link
      href={`/blogs/${post.slug}`}
      className={clsx(styles["blog-card"], className)}
      data-spotlight
      data-reveal
    >
      {post.cover && (
        <div
          className={styles["blog-card__image"]}
          style={{ "--blog-card-cover": `url(${post.cover})` } as CSSProperties}
        />
      )}
      <div className={styles["blog-card__content"]}>
        <div className={styles["blog-card__meta"]}>
          {relativeTimeLabel && (
            <p className={styles["blog-card__date"]}>{relativeTimeLabel}</p>
          )}
          <span
            className={styles["blog-card__views"]}
            title={t("blog.viewsHint")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {isViewsLoading ? (
              <Spinner size={12} className={styles["blog-card__views-loader"]} aria-label={t("blog.viewsLoading")} />
            ) : (
              views.toLocaleString(locale)
            )}
            <InfoOutlinedIcon fontSize="inherit" aria-hidden="true" />
          </span>
        </div>
        {/* The grid card's title morphs into the post page heading (one name per page). */}
        {morph ? (
          <ViewTransition name={`post-title-${post.slug}`} share="morph">
            <h2 className={styles["blog-card__title"]}>{post.title}</h2>
          </ViewTransition>
        ) : (
          <h2 className={styles["blog-card__title"]}>{post.title}</h2>
        )}
        {post.description && (
          <p className={styles["blog-card__excerpt"]}>{post.description}</p>
        )}
        <div className={styles["blog-card__link"]}>
          {t("blog.readMore")} <span aria-hidden="true" className={styles["blog-card__arrow"]}>→</span>
        </div>
      </div>
    </Link>
  );
}
