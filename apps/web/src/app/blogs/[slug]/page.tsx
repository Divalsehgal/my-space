import {
  getContentfulPosts,
  getContentfulPostBySlug,
} from "@/lib/services/contentful";
import type { ContentfulPost } from "@/types";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogPostContainer from "@/containers/BlogPost";
import Breadcrumbs from "@/components/Breadcrumbs";
import { SITE_URL, AUTHOR } from "@/lib/config/site";
import styles from "./styles.module.scss";
import { getT } from "@/i18n/server";

const RELATED_POST_COUNT = 3;

type Props = {
  readonly params: Promise<{ slug: string }>;
};

/**
 * SSG: Generate static paths for all published blog posts
 */
export async function generateStaticParams() {
  const posts = await getContentfulPosts();
  return posts.map((post: ContentfulPost) => ({
    slug: post.slug,
  }));
}

// Ensure dynamic segments are handled even if they don't exist at build time
export const dynamicParams = true;

// Revalidate blog posts (Uses tag-based revalidation via Contentful)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getContentfulPostBySlug(slug);
  const t = getT();

  if (!post) {
    return {
      title: t("meta.postNotFoundTitle"),
      description: t("meta.postNotFoundDescription"),
    };
  }

  const description = post.description || t("meta.postDescription", { title: post.title });
  const url = `/blogs/${slug}`;

  return {
    title: post.title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: post.title,
      description,
      type: "article",
      url,
      publishedTime: post.date || undefined,
      modifiedTime: post.publishedAt || undefined,
      authors: ["Dival Sehgal"],
      tags: post.tags,
      images: [
        post.cover
          ? { url: post.cover, width: 1200, height: 630, alt: post.title }
          : { url: "/og-image.jpg", width: 1200, height: 630, alt: post.title },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [post.cover || "/og-image.jpg"],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getContentfulPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const postUrl = `${SITE_URL}/blogs/${slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description || undefined,
    image: post.cover || undefined,
    datePublished: post.date || undefined,
    dateModified: post.publishedAt || post.date || undefined,
    url: postUrl,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    inLanguage: "en",
    publisher: {
      "@type": "Person",
      name: AUTHOR.name,
      url: SITE_URL,
    },
    author: [
      {
        "@type": "Person",
        name: AUTHOR.name,
        url: SITE_URL,
        jobTitle: AUTHOR.jobTitle,
      },
    ],
  };

  const breadcrumbItems = [
    { label: getT()("nav.blogs"), href: "/blogs" },
    { label: post.title, href: `/blogs/${slug}` },
  ];

  return (
    <div className={`page-scroll ${styles["blog-page"]}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs items={breadcrumbItems} />
      {/* Rendered inline, not behind <Suspense>: streamed boundaries are revealed by a
          script wrapped in a view transition, which Google's renderer aborts, so
          crawlers only ever saw the skeleton. */}
      <BlogPostContent post={post} />
    </div>
  );
}

async function BlogPostContent({ post }: Readonly<{ post: ContentfulPost }>) {
  const posts = await getContentfulPosts();
  const relatedPosts = posts.filter((p) => p.slug !== post.slug).slice(0, RELATED_POST_COUNT);
  return <BlogPostContainer post={post} relatedPosts={relatedPosts} />;
}
