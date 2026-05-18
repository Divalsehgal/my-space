import {
  getContentfulPosts,
  getContentfulPostBySlug,
} from "@/lib/services/contentful";
import type { ContentfulPost } from "@/types";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import BlogPostContainer from "@/containers/BlogPost";
import BlogPostSkeleton from "@/containers/BlogPost/BlogPostSkeleton";
import Breadcrumbs from "@/components/Breadcrumbs";
import styles from "../styles.module.scss";

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

  if (!post) {
    return {
      title: "Blog Post Not Found",
      description: "The requested blog post could not be found.",
    };
  }

  const description =
    post.description || `Read ${post.title} on Dival Sehgal's blog`;

  return {
    title: `${post.title} - Dival Sehgal's Blog`,
    description,
    openGraph: {
      title: post.title,
      description,
      type: "article",
      publishedTime: post.date || undefined,
      authors: ["Dival Sehgal"],
      tags: post.tags,
      images: [
        {
          url: post.cover || "/og-image.png",
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [post.cover || "/og-image.png"],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getContentfulPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description || undefined,
    image: post.cover || undefined,
    datePublished: post.date || undefined,
    author: [
      {
        "@type": "Person",
        name: "Dival Sehgal",
        url: "https://divalsehgal.vercel.app",
      },
    ],
  };

  const breadcrumbItems = [
    { label: "Blogs", href: "/blogs" },
    { label: post.title, href: `/blogs/${slug}` },
  ];

  return (
    <div className={`page-scroll ${styles["blog-page"]}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs items={breadcrumbItems} />
      <Suspense fallback={<BlogPostSkeleton skipBreadcrumbs />}>
        <BlogPostContent post={post} />
      </Suspense>
    </div>
  );
}

function BlogPostContent({ post }: Readonly<{ post: ContentfulPost }>) {
  return <BlogPostContainer post={post} />;
}
