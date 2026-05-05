import { getContentfulPosts } from "@/lib/services/contentful";
import BlogPageContent from "@/containers/Blogs";
import FluidContainer from "@/components/FluidContainer";
import Breadcrumbs from "@/components/Breadcrumbs";
import styles from "./styles.module.scss";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Read the latest articles and insights on web development and AI from Dival Sehgal.",
};

// Revalidate blog listing every 1 hour (ISR - Incremental Static Regeneration)
// This allows the blog listing page to be statically generated and cached,
// while refreshing periodically to show new posts from Contentful.
// Previously revalidate = 0 caused "Dynamic server usage" errors during build.
export const revalidate = 3600; // 1 hour

export default async function Blogs() {
  const posts = await getContentfulPosts();

  const breadcrumbItems = [{ label: "Blogs", href: "/blogs" }];

  if (!posts || posts.length === 0) {
    return (
      <div className="page-scroll">
        <FluidContainer className={styles["blogs-container"]}>
          <h1 className={styles["blogs-title"]}>Blog</h1>
          <p>
            No posts found. Make sure your Notion database is connected and has
            published posts.
          </p>
        </FluidContainer>
      </div>
    );
  }

  return (
    <div className="page-scroll">
      <Breadcrumbs items={breadcrumbItems} />
      <BlogPageContent posts={posts} />
    </div>
  );
}
