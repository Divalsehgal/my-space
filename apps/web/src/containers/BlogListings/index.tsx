import FluidContainer from "@/components/FluidContainer";
import ScrollReveals from "@/components/ScrollReveals";
import ScrollToTopOnMount from "@/components/ScrollToTopOnMount";
import Carousel from "@/components/Carousel";
import { getT } from "@/i18n/server";
import type { ContentfulPost } from "@/types";
import BlogCard from "./BlogCard";
import BlogSearch from "./BlogSearch";
import styles from "./styles.module.scss";

type BlogPageContentProps = {
  posts: ContentfulPost[];
  initialViewCounts?: Record<string, number>;
};

const FEATURED_COUNT = 5;

const searchText = (post: ContentfulPost) =>
  [post.title, post.description, ...(post.tags ?? [])].filter(Boolean).join(" ").toLowerCase();

/**
 * Blog listing, rendered on the server. Client code is limited to the leaves:
 * the featured carousel's paging, the search box and the scroll effects.
 */
export default function BlogPageContent({ posts, initialViewCounts = {} }: Readonly<BlogPageContentProps>) {
  const t = getT();

  return (
    <div className={styles.blogs}>
      <ScrollToTopOnMount />
      <ScrollReveals />
      <FluidContainer>
        {posts.length === 0 ? (
          <div className={styles["blogs-empty-state"]}>
            <h1 className={styles["blogs-title"]}>{t("blog.emptyTitle")}</h1>
            <p className={styles["blogs-empty-message"]}>{t("blog.emptyMessage")}</p>
          </div>
        ) : (
          <>
            <header className={styles["blogs__header"]}>
              <h1 className={styles["blogs__title"]} data-split>{t("blog.title")}</h1>
              <p className={styles["blogs__description"]}>{t("blog.description")}</p>
            </header>

            <div className={styles["blogs__featured"]}>
              <Carousel
                sectionTitle={t("blog.topPosts")}
                progressLabelPrefix={t("blog.post")}
                showNavigation={false}
                showProgress={false}
                showDots
                autoPlay
                slides={posts.slice(0, FEATURED_COUNT).map((post) => (
                  <BlogCard key={post.id} post={post} views={initialViewCounts[post.slug]} />
                ))}
              />
            </div>

            <BlogSearch
              posts={posts.map((post) => ({
                id: post.id,
                haystack: searchText(post),
                card: <BlogCard post={post} views={initialViewCounts[post.slug]} morph />,
              }))}
            />
          </>
        )}
      </FluidContainer>
    </div>
  );
}
