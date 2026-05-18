import { getContentfulPosts } from "@/lib/services/contentful";
import BlogPageContent from "@/containers/BlogListings";
import BlogListingsSkeleton from "@/containers/BlogListings/BlogListingsSkeleton";
import type { Metadata } from "next";
import { Suspense } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import styles from "./styles.module.scss";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Read the latest articles and insights on web development and AI from Dival Sehgal.",
};

async function BlogsContent() {
  const posts = await getContentfulPosts();
  return <BlogPageContent posts={posts ?? []} />;
}

export default async function Blogs() {
  return (
    <div className={`page-scroll ${styles["blog-page"]}`}>
      <Breadcrumbs items={[{ label: "Blogs", href: "/blogs" }]} />
      <Suspense fallback={<BlogListingsSkeleton skipBreadcrumbs />}>
        <BlogsContent />
      </Suspense>
    </div>
  );
}
