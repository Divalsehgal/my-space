import FluidContainer from "@/components/FluidContainer";
import type { ContentfulPost } from "@/types";
import {
  renderContentfulRichText,
  extractToc,
} from "@/features/blog/ContentfulRenderer";
import TableOfContents from "@/components/TableOfContents";
import styles from "./styles.module.scss";

type BlogPostProps = {
  post: ContentfulPost;
};

export default function BlogPost({ post }: Readonly<BlogPostProps>) {
  const content = renderContentfulRichText(post.content);
  const tocItems = extractToc(post.content);

  return (
    <article className={styles["blog-post"]}>
      <FluidContainer className={styles["blog-post__container"]}>
        <div className={styles["blog-post__layout"]}>
          <aside className={styles["blog-post__sidebar"]}>
            <TableOfContents items={tocItems} />
          </aside>

          <main className={styles["blog-post__main"]}>
            <header className={styles["blog-post__header"]}>
              <h1 className={styles["blog-post__title"]}>{post.title}</h1>
              <div className={styles["blog-post__meta"]}>
                {post.date && (
                  <p className={styles["blog-post__date"]}>
                    {new Date(post.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}
                {post.tags && (
                  <ul className={styles["blog-post__tags"]}>
                    {post.tags.map((tag: string) => (
                      <li key={tag} className={styles["blog-post__tag"]}>
                        <span>{tag}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </header>
            <aside className={styles["blog-post__mobile-toc"]}>
              <TableOfContents items={tocItems} />
            </aside>
            <section className={styles["blog-post__content"]}>
              {content}
            </section>
          </main>
        </div>
      </FluidContainer>
    </article>
  );
}
