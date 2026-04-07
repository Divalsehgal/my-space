/**
 * Blog domain types.
 * Covers Notion-sourced blog post data shapes.
 */

export type NotionBlogPost = {
    id: string;
    title: string;
    slug: string;
    tags: string[];
    date: string | null;
    description: string | null;
    cover: string | null;
};
