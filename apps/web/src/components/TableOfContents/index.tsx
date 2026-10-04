import styles from "./styles.module.scss";
import { getT } from "@/i18n/server";

/** TOC entries at this level are indented as subsections (see extractToc). */
const SUBSECTION_LEVEL = 3;

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
  const t = getT();
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav className={styles.toc} aria-label={t("toc.title")}>
      <div className={styles.toc__title}>{t("toc.title")}</div>
      <ul className={styles.toc__list}>
        {items.map((item) => (
          <li
            key={item.id}
            className={`${styles.toc__item} ${item.level === SUBSECTION_LEVEL ? styles["toc__item--h3"] : styles["toc__item--h1"]}`}
          >
            <a 
              href={`#${item.id}`} 
              className={styles.toc__link}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
