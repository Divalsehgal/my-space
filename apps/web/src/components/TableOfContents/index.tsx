"use client";

import { useEffect, useState } from "react";
import styles from "./styles.module.scss";

/** TOC entries at this level are indented as subsections (see extractToc). */
const SUBSECTION_LEVEL = 3;

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  items: TocItem[];
  /** Translated heading; passed in so this renders in server and client trees. */
  title: string;
}

/**
 * Table of Contents component for blog posts
 * Renders a doc-style sidebar with active heading spy and smooth scroll navigation
 */
export default function TableOfContents({
  items,
  title,
}: Readonly<TableOfContentsProps>) {
  const [activeId, setActiveId] = useState<string>(items?.[0]?.id || "");

  useEffect(() => {
    if (!items || items.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) {
          setActiveId(visible.target.id);
        }
      },
      {
        rootMargin: "-80px 0% -60% 0%",
        threshold: 0,
      },
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) {
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, [items]);

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav className={styles.toc} aria-label={title}>
      <div className={styles.toc__title}>{title}</div>
      <ul className={styles.toc__list}>
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <li
              key={item.id}
              className={`${styles.toc__item} ${item.level === SUBSECTION_LEVEL ? styles["toc__item--h3"] : styles["toc__item--h1"]}`}
            >
              <a
                href={`#${item.id}`}
                className={styles.toc__link}
                data-active={isActive ? "true" : undefined}
                aria-current={isActive ? "location" : undefined}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
