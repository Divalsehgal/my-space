import type { ReactNode } from "react";
import styles from "./styles.module.scss";

/** The post body: rendered rich text (and the quiz) with prose typography. */
export default function BlogPostContent({ children }: Readonly<{ children: ReactNode }>) {
  return <section className={styles.content}>{children}</section>;
}
