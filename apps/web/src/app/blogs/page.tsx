import { getContentfulPosts } from "@/lib/services/contentful";
import BlogPageContent from "@/containers/BlogListings";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getViewCounts } from "@/lib/services/analytics";
import { unstable_cache } from "next/cache";
import styles from "./styles.module.scss";
import { getT } from "@/i18n/server";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, AUTHOR, PERSON_ID, BLOG_ID } from "@/lib/config/site";

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

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": BLOG_ID,
    url: `${SITE_URL}/blogs`,
    name: getT()("meta.blogTitle"),
    author: { "@type": "Person", "@id": PERSON_ID, name: AUTHOR.name, url: SITE_URL },
    blogPost: blogPosts.map((post) => ({
      "@type": "BlogPosting",
      "@id": `${SITE_URL}/blogs/${post.slug}#article`,
      headline: post.title,
      url: `${SITE_URL}/blogs/${post.slug}`,
      datePublished: post.date || undefined,
    })),
  };

  return (
    <>
      <JsonLd data={blogJsonLd} />
      <BlogPageContent posts={blogPosts} initialViewCounts={viewCounts} />
    </>
  );
}

export default function Blogs() {
  const t = getT();
  return (
    <div className={`page-scroll ${styles["blog-page"]}`}>
      <Breadcrumbs items={[{ label: t("nav.blogs"), href: "/blogs" }]} />
      {/* Inline rather than streamed so crawlers get the post links in the HTML
          (see the note in blogs/[slug]/page.tsx). */}
      <BlogsContent />
    </div>
  );
}
