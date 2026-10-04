"use client";

import { useMemo, useState, useTransition, type ChangeEvent, type ReactNode } from "react";
import clsx from "clsx";
import { useT } from "@/i18n/client";
import styles from "./styles.module.scss";

export type SearchablePost = {
  id: string;
  /** Lower-cased title, description and tags, built on the server. */
  haystack: string;
  /** The server-rendered card. */
  card: ReactNode;
};

/**
 * The only interactive part of the blog listing: the search box and the
 * filtered grid. Cards arrive pre-rendered, so no post data beyond the search
 * text is sent to the browser.
 */
export default function BlogSearch({ posts }: Readonly<{ posts: SearchablePost[] }>) {
  const t = useT();
  const [inputValue, setInputValue] = useState("");
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setInputValue(next);
    startTransition(() => setQuery(next.trim().toLowerCase()));
  };

  const visible = useMemo(() => (query ? posts.filter((post) => post.haystack.includes(query)) : posts), [posts, query]);
  // Lead story only for the unfiltered list, and only when there's a row to lead.
  const hasLead = !query && visible.length > 2;

  return (
    <>
      <div className={styles["blog-search__bar"]}>
        <h2 className={styles["blog-search__title"]} data-split>{t("blog.allPosts")}</h2>
        <input
          type="search"
          placeholder={t("blog.search")}
          aria-label={t("blog.search")}
          value={inputValue}
          onChange={onChange}
          className={styles["blog-search__input"]}
        />
      </div>

      <div className={styles["blog-search__grid"]}>
        {visible.length > 0 ? (
          visible.map((post, index) => (
            <div
              key={post.id}
              className={clsx(styles["blog-search__cell"], hasLead && index === 0 && styles["blog-search__cell--lead"])}
            >
              {post.card}
            </div>
          ))
        ) : (
          <p className={styles["blog-search__empty"]}>{t("blog.noResults")}</p>
        )}
      </div>
    </>
  );
}
