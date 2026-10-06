import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContentfulPostItemBySlug, getContentfulPosts } from "@/lib/services/contentful";
import { isPreviewAllowed } from "@/lib/preview";
import BlogPostPreview from "@/containers/BlogPostPreview";
import LivePreviewProvider from "@/components/LivePreviewProvider";
import AuthorBio from "@/components/AuthorBio";
import RelatedPosts from "@/components/RelatedPosts";
import styles from "./styles.module.scss";

const RELATED_POST_COUNT = 3;

// Editor-only UI that the public never sees, so it isn't routed through the
// Contentful-managed translations.
const BANNER_TEXT = "Preview mode — showing draft content";
const EXIT_TEXT = "Exit preview";

type Props = {
  readonly params: Promise<{ slug: string }>;
};

// Drafts are never cached or prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Preview",
  robots: { index: false, follow: false, nocache: true },
};

export default async function BlogPostPreviewPage({ params }: Props) {
  // Public visitors in production land on the regular 404.
  if (!(await isPreviewAllowed())) {
    notFound();
  }

  const { slug } = await params;
  const [item, posts] = await Promise.all([getContentfulPostItemBySlug(slug, true), getContentfulPosts()]);

  if (!item) {
    notFound();
  }

  const relatedPosts = posts.filter((p) => p.slug !== slug).slice(0, RELATED_POST_COUNT);

  return (
    <div className={`page-scroll ${styles["preview-page"]}`}>
      <div className={styles["preview-page__banner"]} role="status">
        <span>{BANNER_TEXT}</span>
        <a href={`/api/preview/disable?slug=${encodeURIComponent(slug)}`} className={styles["preview-page__exit"]}>
          {EXIT_TEXT}
        </a>
      </div>
      <LivePreviewProvider>
        <BlogPostPreview initialItem={item}>
          <AuthorBio />
          <RelatedPosts posts={relatedPosts} />
        </BlogPostPreview>
      </LivePreviewProvider>
    </div>
  );
}
