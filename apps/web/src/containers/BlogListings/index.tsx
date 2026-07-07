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
import FluidContainer from "@/components/FluidContainer";
import Carousel from "@/components/Carousel";
import type { ContentfulPost } from "@/types";
import styles from "./styles.module.scss";

type BlogPageContentProps = {
  posts: ContentfulPost[];
};

function getRelativeTimeLabel(
  dateString?: string | null,
  isUpdated = false,
): string | null {
  if (!dateString) {
    return null;
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const diffInMs = Date.now() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const prefix = isUpdated ? "Last updated" : "Published";

  if (diffInDays <= 0) {
    return `${prefix} today`;
  }

  if (diffInDays === 1) {
    return `${prefix} 1 day ago`;
  }

  return `${prefix} ${diffInDays} days ago`;
}

type BlogCardCoverStyle = CSSProperties & {
  "--blog-card-cover"?: string;
};

function getBlogCardCoverStyle(cover: string): BlogCardCoverStyle {
  return {
    "--blog-card-cover": `url(${cover})`,
  };
}

function BlogCard({ post }: Readonly<{ post: ContentfulPost }>) {
  const isUpdatedPost = Boolean(
    post.publishedAt && post.publishedAt !== post.date,
  );
  const relativeTimeLabel = getRelativeTimeLabel(
    isUpdatedPost ? post.publishedAt : post.date,
    isUpdatedPost,
  );

  return (
    <Link href={`/blogs/${post.slug}`} className={styles["blogs__card"]}>
      {post.cover && (
        <div
          className={styles["blogs__card-image"]}
          style={getBlogCardCoverStyle(post.cover)}
        />
      )}
      <div className={styles["blogs__card-content"]}>
        {relativeTimeLabel && (
          <p className={styles["blogs__card-date"]}>{relativeTimeLabel}</p>
        )}
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
    (post: ContentfulPost) => <BlogCard post={post} />,
    [],
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
                  <BlogCard key={post.id} post={post} />
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
