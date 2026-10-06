import type { ReactNode } from "react";
import FluidContainer from "@/components/FluidContainer";
import type { ContentfulPost } from "@/types";
import type { Translate } from "@/i18n/core";
import { extractToc, renderContentfulRichText } from "@/features/blog/ContentfulRenderer";
import TableOfContents from "@/components/TableOfContents";
import { formatDate } from "@/utils/date";
import BlogViewTracker from "@/components/BlogViewTracker";
import BlogQuiz from "@/components/BlogQuiz";
import ViewTransition from "@/components/ViewTransition";
import BlogPostContent from "../BlogPostContent";
import styles from "./styles.module.scss";

type BlogPostArticleProps = {
  post: ContentfulPost;
  /** `getT()` on the server, `useT()` in the client preview — so this renders in both trees. */
  t: Translate;
  /** Off in preview: drafts must not record views. */
  trackViews?: boolean;
  /** Rendered after the body (author bio, related posts). */
  children?: ReactNode;
};

/** The post article layout, shared by the public page and the live preview. */
export default function BlogPostArticle({ post, t, trackViews = true, children }: Readonly<BlogPostArticleProps>) {
  const content = renderContentfulRichText(post.content);
  const tocItems = extractToc(post.content);
  const tocTitle = t("toc.title");

  const formattedDate = formatDate(post.publishedAt || post.date);

  return (
    <article className={styles["blog-post"]}>
      <FluidContainer className={styles["blog-post__container"]}>
        <div className={styles["blog-post__layout"]}>
          <div className={styles["blog-post__sidebar"]}>
            <TableOfContents items={tocItems} title={tocTitle} />
          </div>

          <div className={styles["blog-post__main"]}>
            <header className={styles["blog-post__header"]}>
              <ViewTransition name={`post-title-${post.slug}`} share="morph">
                <h1 className={styles["blog-post__title"]}>{post.title}</h1>
              </ViewTransition>
              <div className={styles["blog-post__meta"]}>
                {formattedDate && (
                  <p className={styles["blog-post__date"]}>{t("post.lastUpdated", { date: formattedDate })}</p>
                )}
                {trackViews && <BlogViewTracker slug={post.slug} />}
              </div>
            </header>
            <div className={styles["blog-post__mobile-toc"]}>
              <TableOfContents items={tocItems} title={tocTitle} />
            </div>
            <BlogPostContent>
              {content}
              {post.quiz && <BlogQuiz quiz={post.quiz} />}
            </BlogPostContent>
            {children}
          </div>
        </div>
      </FluidContainer>
    </article>
  );
}
