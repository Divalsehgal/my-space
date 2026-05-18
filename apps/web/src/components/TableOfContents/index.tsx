import styles from "./styles.module.scss";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  items: TocItem[];
}

/**
 * Table of Contents component for blog posts
 * Renders a doc-style sidebar with support for multiple heading levels
 */
export default function TableOfContents({
  items,
}: Readonly<TableOfContentsProps>) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav className={styles.toc} aria-label="Table of contents">
      <div className={styles.toc__title}>Table of Contents</div>
      <ul className={styles.toc__list}>
        {items.map((item) => (
          <li
            key={item.id}
            className={`${styles.toc__item} ${item.level === 3 ? styles["toc__item--h3"] : styles["toc__item--h2"]}`}
          >
            <a href={`#${item.id}`} className={styles.toc__link}>
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
