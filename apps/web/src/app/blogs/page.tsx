import { getContentfulPosts } from "@/lib/services/contentful";
import BlogPageContent from "@/containers/BlogListings";
import BlogListingsSkeleton from "@/containers/BlogListings/BlogListingsSkeleton";
import type { Metadata } from "next";
import { Suspense } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getViewCounts } from "@/lib/services/analytics";
import { unstable_cache } from "next/cache";
import styles from "./styles.module.scss";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Read the latest articles and insights on web development and AI from Dival Sehgal.",
};

const getCachedViewCounts = unstable_cache(
  async (slugs: string[]) => getViewCounts(slugs),
  ["blog-listing-view-counts"],
  { revalidate: 60 },
);

async function BlogsContent() {
  const posts = await getContentfulPosts();
  const blogPosts = posts ?? [];
  const viewCounts = await getCachedViewCounts(blogPosts.map((post) => post.slug));

  return <BlogPageContent posts={blogPosts} initialViewCounts={viewCounts} />;
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
