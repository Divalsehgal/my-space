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

export default async function Blogs() {
  const posts = await getContentfulPosts();

  const breadcrumbItems = [{ label: "Blogs", href: "/blogs" }];

  if (!posts || posts.length === 0) {
    return (
      <div className="page-scroll">
        <Breadcrumbs items={breadcrumbItems} />
        <FluidContainer>
          <div className={styles["blogs-empty-state"]}>
            <h1 className={styles["blogs-title"]}>Blog</h1>
            <p className={styles["blogs-empty-message"]}>
              No posts found. Make sure your Contentful space is connected and has
              published posts.
            </p>
          </div>
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
