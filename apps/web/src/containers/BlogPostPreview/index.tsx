"use client";

import type { ReactNode } from "react";
import { parse } from "graphql";
import { useContentfulLiveUpdates } from "@contentful/live-preview/react";
import { mapContentfulPost, type ContentfulPostItem } from "@/lib/contentful/mappers";
import { BLOG_POST_BY_SLUG_QUERY } from "@/lib/contentful/queries";
import BlogPostArticle from "@/containers/BlogPost/BlogPostArticle";
import { useT } from "@/i18n/client";

// Lets the SDK resolve draft edits against exactly the fields the page fetched.
const LIVE_UPDATES_QUERY = parse(BLOG_POST_BY_SLUG_QUERY);

type BlogPostPreviewProps = {
  /** Draft item fetched server-side with `preview: true`. */
  initialItem: ContentfulPostItem;
  /** Server-rendered slots that don't depend on the draft (author bio, related posts). */
  children?: ReactNode;
};

/**
 * Draft blog post that re-renders as the editor types in Contentful's Live
 * Preview pane. Must sit under LivePreviewProvider.
 */
export default function BlogPostPreview({ initialItem, children }: Readonly<BlogPostPreviewProps>) {
  const t = useT();
  const item = useContentfulLiveUpdates(initialItem, { query: LIVE_UPDATES_QUERY });
  const post = mapContentfulPost(item);

  return (
    <BlogPostArticle post={post} t={t} trackViews={false}>
      {children}
    </BlogPostArticle>
  );
}
