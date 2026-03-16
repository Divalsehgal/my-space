import { getNotionPosts } from "@/lib/services/notion";
import BlogPageContent from "@/containers/Blogs";
import FluidContainer from "@/components/FluidContainer";
import Link from "next/link";
import styles from "./styles.module.scss";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Blog",
    description: "Read the latest articles and insights on web development and AI from Dival Sehgal.",
};

export default async function Blogs() {
    const posts = await getNotionPosts();

    if (!posts || posts.length === 0) {
        return (
            <main className="page-scroll">
                <FluidContainer className={styles.container}>
                    <h1 className={styles.title}>Blog</h1>
                    <p>No posts found. Make sure your Notion database is connected and has published posts.</p>
                </FluidContainer>
            </main>

        );
    }

    return (
        <main className="page-scroll">
            <BlogPageContent posts={posts} />
        </main>

    );
}
