import { getNotionPosts, getPageContent } from "@/lib/services/notion";
import { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import styles from "./styles.module.scss";
import { notFound } from "next/navigation";
import FluidContainer from "@/components/FluidContainer";
import { renderBlock, renderList } from "@/features/blog/Rendering";

type Props = {
    params: Promise<{ slug: string }>;
};


/**
 * SSG: Generate static paths for all published blog posts
 */
export async function generateStaticParams() {
    const posts = await getNotionPosts();
    return posts.map((post) => ({
        slug: post.slug,
    }));
}

// Ensure dynamic segments are handled even if they don't exist at build time
export const dynamicParams = true;

// Revalidate every 60 seconds
export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const posts = await getNotionPosts();
    const post = posts.find((p) => p.slug === slug);

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
    const posts = await getNotionPosts();
    const post = posts.find((p) => p.slug === slug);

    if (!post) {
        notFound();
    }

    const blocks = await getPageContent(post.id);

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post.title,
        "description": post.description || undefined,
        "image": post.cover || undefined,
        "datePublished": post.date || undefined,
        "author": [{
            "@type": "Person",
            "name": "Dival Sehgal",
            "url": "https://divalsehgal.vercel.app",
        }]
    };

    const breadcrumbItems = [
        { label: "Blogs", href: "/blogs" },
        { label: post.title, href: `/blogs/${slug}` },
    ];

    const content = [];
    let currentList: { type: "bulleted_list_item" | "numbered_list_item"; items: any[] } | null = null;

    for (const block of blocks as any[]) {
        if (block.type === "bulleted_list_item" || block.type === "numbered_list_item") {
            const listType = block.type as "bulleted_list_item" | "numbered_list_item";

            if (currentList && currentList.type === listType) {
                currentList.items.push(block);
            } else {
                if (currentList) {
                    content.push(renderList(currentList));
                }
                currentList = { type: listType, items: [block] };
            }
        } else {
            if (currentList) {
                content.push(renderList(currentList));
                currentList = null;
            }
            content.push(renderBlock(block));
        }
    }

    if (currentList) {
        content.push(renderList(currentList));
    }

    return (
        <div className="page-scroll">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Breadcrumbs items={breadcrumbItems} className={styles["blog-post__breadcrumbs"]} />
            <article className={styles["blog-post"]}>
                <FluidContainer maxWidth="800px">
                    <header className={styles["blog-post__header"]}>
                        <h1 className={styles["blog-post__title"]}>{post.title}</h1>
                        <div className={styles["blog-post__meta"]}>
                            {post.date && (
                                <p className={styles["blog-post__date"]}>
                                    {new Date(post.date).toLocaleDateString("en-US", {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                     })}
                                </p>
                            )}
                            {post.tags && (
                                <ul className={styles["blog-post__tags"]}>
                                    {post.tags.map((tag) => (
                                        <li key={tag} className={styles["blog-post__tag"]}>
                                            {tag}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </header>
                    <section className={styles["blog-post__content"]}>
                        {content}
                    </section>
                </FluidContainer>
            </article>
        </div>
    );
}
