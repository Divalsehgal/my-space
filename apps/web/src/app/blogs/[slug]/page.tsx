import { getContentfulPosts, getContentfulPostBySlug, ContentfulPost } from "@/lib/services/contentful";
import { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import styles from "./styles.module.scss";
import { notFound } from "next/navigation";
import FluidContainer from "@/components/FluidContainer";
import { renderContentfulRichText } from "@/features/blog/ContentfulRenderer";

type Props = {
  params: Promise<{ slug: string }>;
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

// Revalidate blog posts every 60 seconds (ISR - Incremental Static Regeneration)
// This allows pages to be statically generated at build time and on-demand,
// while refreshing content periodically to fetch new Notion data.
// Note: revalidate = 0 would cause "Dynamic server usage" errors during static generation
export const revalidate = 60;

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

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = await getContentfulPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const content = renderContentfulRichText(post.content);

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
    <div className="page-scroll">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs
        items={breadcrumbItems}
        className={styles["blog-post__breadcrumbs"]}
      />
      <article className={styles["blog-post"]}>
        <FluidContainer className={styles["blog-post__container"]}>
          <header className={styles["blog-post__header"]}>
            <h1 className={styles["blog-post__title"]}>{post.title}</h1>
            <div className={styles["blog-post__meta"]}>
              {post.date && (
                <p className={styles["blog-post__date"]}>
                  {new Date(post.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
              {post.tags && (
                <ul className={styles["blog-post__tags"]}>
                  {post.tags.map((tag: string) => (
                    <li key={tag} className={styles["blog-post__tag"]}>
                      <span>{tag}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </header>
          <section className={styles["blog-post__content"]}>{content}</section>
        </FluidContainer>
      </article>
    </div>
  );
}
