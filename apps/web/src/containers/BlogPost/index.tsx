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

type BlogPostProps = {
  post: ContentfulPost;
  relatedPosts?: readonly ContentfulPost[];
};

export default function BlogPost({ post, relatedPosts = [] }: Readonly<BlogPostProps>) {
  const content = renderContentfulRichText(post.content);
  const tocItems = extractToc(post.content);

  const formattedDate = formatDate(post.publishedAt || post.date);

  return (
    <article className={styles["blog-post"]}>
      <FluidContainer className={styles["blog-post__container"]}>
        <div className={styles["blog-post__layout"]}>
          <aside className={styles["blog-post__sidebar"]}>
            <TableOfContents items={tocItems} />
          </aside>

          <div className={styles["blog-post__main"]}>
            <header className={styles["blog-post__header"]}>
              <h1 className={styles["blog-post__title"]}>{post.title}</h1>
              <div className={styles["blog-post__meta"]}>
                {formattedDate && (
                  <p className={styles["blog-post__date"]}>Last updated at : {formattedDate}</p>
                )}
                <BlogViewTracker slug={post.slug} />
              </div>
            </header>
            <aside className={styles["blog-post__mobile-toc"]}>
              <TableOfContents items={tocItems} />
            </aside>
            <section className={styles["blog-post__content"]}>
              {content}
              {post.quiz && <BlogQuiz quiz={post.quiz} />}
            </section>
            <AuthorBio />
            <RelatedPosts posts={relatedPosts} />
          </div>
        </div>
      </FluidContainer>
    </article>
  );
}
