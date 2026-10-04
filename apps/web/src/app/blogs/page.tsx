import { getContentfulPosts } from "@/lib/services/contentful";
import BlogPageContent from "@/containers/BlogListings";
import BlogListingsSkeleton from "@/containers/BlogListings/BlogListingsSkeleton";
import type { Metadata } from "next";
import { Suspense } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getViewCounts } from "@/lib/services/analytics";
import { unstable_cache } from "next/cache";
import styles from "./styles.module.scss";
import { getT } from "@/i18n/server";

export function generateMetadata(): Metadata {
  const t = getT();
  return {
    title: t("meta.blogTitle"),
    description: t("meta.blogDescription"),
    alternates: {
      canonical: "/blogs",
    },
  };
}

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
  const t = getT();
  return (
    <div className={`page-scroll ${styles["blog-page"]}`}>
      <Breadcrumbs items={[{ label: t("nav.blogs"), href: "/blogs" }]} />
      <Suspense fallback={<BlogListingsSkeleton skipBreadcrumbs />}>
        <BlogsContent />
      </Suspense>
    </div>
  );
}
