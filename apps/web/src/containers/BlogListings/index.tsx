"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ChangeEvent,
  type CSSProperties,
} from "react";
import Link from "next/link";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import FluidContainer from "@/components/FluidContainer";
import Carousel from "@/components/Carousel";
import type { ContentfulPost } from "@/types";
import { getRelativeTimeLabel } from "@/utils/date";
import styles from "./styles.module.scss";

type BlogPageContentProps = {
  posts: ContentfulPost[];
  initialViewCounts?: Record<string, number>;
};

type BlogCardCoverStyle = CSSProperties & {
  "--blog-card-cover"?: string;
};

function getBlogCardCoverStyle(cover: string): BlogCardCoverStyle {
  return {
    "--blog-card-cover": `url(${cover})`,
  };
}

function BlogCard({
  post,
  views,
}: Readonly<{ post: ContentfulPost; views?: number | null }>) {
  const isUpdatedPost = Boolean(
    post.publishedAt && post.publishedAt !== post.date,
  );
  const relativeTimeLabel = getRelativeTimeLabel(
    isUpdatedPost ? post.publishedAt : post.date,
    isUpdatedPost,
  );
  const isViewsLoading = views === null || views === undefined;

  return (
    <Link href={`/blogs/${post.slug}`} className={styles["blogs__card"]}>
      {post.cover && (
        <div
          className={styles["blogs__card-image"]}
          style={getBlogCardCoverStyle(post.cover)}
        />
      )}
      <div className={styles["blogs__card-content"]}>
        <div className={styles["blogs__card-meta"]}>
          {relativeTimeLabel && (
            <p className={styles["blogs__card-date"]}>{relativeTimeLabel}</p>
          )}
          <span
            className={styles["blogs__card-views"]}
            title="Views are counted after at least 5 seconds of active reading."
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
              <span
                className={styles["blogs__card-views-loader"]}
                role="status"
                aria-label="Loading view count"
              />
            ) : (
              views.toLocaleString()
            )}
            <InfoOutlinedIcon fontSize="inherit" aria-hidden="true" />
          </span>
        </div>
        <h2 className={styles["blogs__card-title"]}>{post.title}</h2>
        {post.description && (
          <p className={styles["blogs__card-excerpt"]}>{post.description}</p>
        )}
        <div className={styles["blogs__card-link"]}>
          Read More <span aria-hidden="true">→</span>
        </div>
      </div>
    </Link>
  );
}

export default function BlogPageContent({
  posts,
  initialViewCounts = {},
}: Readonly<BlogPageContentProps>) {
  const [inputValue, setInputValue] = useState("");
  const [deferredQuery, setDeferredQuery] = useState("");
  const [, startTransition] = useTransition();

  const changeHandler = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const nextValue = e.target.value;
      setInputValue(nextValue);
      startTransition(() => {
        setDeferredQuery(nextValue);
      });
    },
    [startTransition],
  );

  useEffect(() => {
    const html = document.documentElement;
    const previousScrollBehavior = html.style.scrollBehavior;

    html.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);

    return () => {
      html.style.scrollBehavior = previousScrollBehavior;
    };
  }, []);

  const featuredPosts = useMemo(() => posts.slice(0, 5), [posts]);

  const filteredPosts = useMemo(() => {
    const query = deferredQuery.toLowerCase();
    return posts.filter((post) => {
      const matchesSearch =
        (post.title?.toLowerCase() || "").includes(query) ||
        (post.description?.toLowerCase() || "").includes(query) ||
        (post.tags || []).some((tag) =>
          (tag?.toLowerCase() || "").includes(query),
        );

      return matchesSearch;
    });
  }, [posts, deferredQuery]);

  const renderCarouselItem = useCallback(
    (post: ContentfulPost) => (
      <BlogCard post={post} views={initialViewCounts[post.slug]} />
    ),
    [initialViewCounts],
  );

  return (
    <div className={styles.blogs}>
      <FluidContainer>
        {posts.length === 0 ? (
          <div className={styles["blogs-empty-state"]}>
            <h1 className={styles["blogs-title"]}>Blog</h1>
            <p className={styles["blogs-empty-message"]}>
              No posts found. Make sure your Contentful space is connected and
              has published posts.
            </p>
          </div>
        ) : (
          <>
            <div className={styles["blogs__header"]}>
              <h1 className={styles["blogs__title"]}>Tech Blogs</h1>
              <p className={styles["blogs__description"]}>
                Insights, and stories from the world of technology.
              </p>
            </div>

            {featuredPosts.length > 0 && (
              <div className={styles["blogs__featured"]}>
                <Carousel
                  sectionTitle="Top Posts"
                  items={featuredPosts}
                  renderItem={renderCarouselItem}
                  progressLabelPrefix="Post"
                  showNavigation={false}
                  showProgress={false}
                  showDots={true}
                  autoPlay={true}
                />
              </div>
            )}

            <div className={styles["blogs__search-container"]}>
              <h2 className={styles["blogs__search-title"]}>All Posts</h2>
              <input
                type="text"
                placeholder="Search posts..."
                value={inputValue}
                onChange={changeHandler}
                className={styles["blogs__search-input"]}
              />
            </div>

            <div className={styles["blogs__grid"]}>
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <BlogCard
                    key={post.id}
                    post={post}
                    views={initialViewCounts[post.slug]}
                  />
                ))
              ) : (
                <p className={styles["blogs__no-results"]}>
                  No posts found matching your search.
                </p>
              )}
            </div>
          </>
        )}
      </FluidContainer>
    </div>
  );
}
