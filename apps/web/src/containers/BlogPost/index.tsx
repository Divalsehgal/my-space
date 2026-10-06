import type { ContentfulPost } from "@/types";
import AuthorBio from "@/components/AuthorBio";
import RelatedPosts from "@/components/RelatedPosts";
import BlogPostArticle from "./BlogPostArticle";
import { getT } from "@/i18n/server";

type BlogPostProps = {
  post: ContentfulPost;
  relatedPosts?: readonly ContentfulPost[];
};

export default function BlogPost({ post, relatedPosts = [] }: Readonly<BlogPostProps>) {
  return (
    <BlogPostArticle post={post} t={getT()}>
      <AuthorBio />
      <RelatedPosts posts={relatedPosts} />
    </BlogPostArticle>
  );
}
