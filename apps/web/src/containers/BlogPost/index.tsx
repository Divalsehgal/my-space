import FluidContainer from "@/components/FluidContainer";
import type { ContentfulPost } from "@/types";
import { extractToc, renderContentfulRichText } from "@/features/blog/ContentfulRenderer";
import TableOfContents from "@/components/TableOfContents";
import { formatDate } from "@/utils/date";
import BlogViewTracker from "@/components/BlogViewTracker";
import BlogQuiz from "@/components/BlogQuiz";
import AuthorBio from "@/components/AuthorBio";
import RelatedPosts from "@/components/RelatedPosts";
import styles from "./styles.module.scss";
import BlogPostContent from "./BlogPostContent";
import ViewTransition from "@/components/ViewTransition";
import { getT } from "@/i18n/server";

type BlogPostProps = {
  post: ContentfulPost;
  relatedPosts?: readonly ContentfulPost[];
};

export default function BlogPost({ post, relatedPosts = [] }: Readonly<BlogPostProps>) {
  const t = getT();
  const content = renderContentfulRichText(post.content);
  const tocItems = extractToc(post.content);

  const formattedDate = formatDate(post.publishedAt || post.date);

  return (
    <article className={styles["blog-post"]}>
      <FluidContainer className={styles["blog-post__container"]}>
        <div className={styles["blog-post__layout"]}>
          <div className={styles["blog-post__sidebar"]}>
            <TableOfContents items={tocItems} />
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
                <BlogViewTracker slug={post.slug} />
              </div>
            </header>
            <div className={styles["blog-post__mobile-toc"]}>
              <TableOfContents items={tocItems} />
            </div>
            <BlogPostContent>
              {content}
              {post.quiz && <BlogQuiz quiz={post.quiz} />}
            </BlogPostContent>
            <AuthorBio />
            <RelatedPosts posts={relatedPosts} />
          </div>
        </div>
      </FluidContainer>
    </article>
  );
}
