import { getNotionPosts, getNotionPostContent } from "@/lib/services/notion";
import { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import styles from "./styles.module.scss";
import { notFound } from "next/navigation";
import FluidContainer from "@/components/FluidContainer";

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

    const blocks = await getNotionPostContent(post.id);

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

    return (
        <main className="page-scroll">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Breadcrumbs items={breadcrumbItems} />
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
                        {(() => {
                            const result = [];
                            let currentList: { type: string; items: any[] } | null = null;

                            for (const block of blocks) {
                                if (block.type === "bulleted_list_item" || block.type === "numbered_list_item") {
                                    const listType = block.type === "bulleted_list_item" ? "ul" : "ol";

                                    if (currentList && currentList.type === listType) {
                                        currentList.items.push(block);
                                    } else {
                                        if (currentList) {
                                            result.push(renderList(currentList));
                                        }
                                        currentList = { type: listType, items: [block] };
                                    }
                                } else {
                                    if (currentList) {
                                        result.push(renderList(currentList));
                                        currentList = null;
                                    }
                                    result.push(renderBlock(block));
                                }
                            }

                            if (currentList) {
                                result.push(renderList(currentList));
                            }

                            return result;

                            function renderRichText(richText: any[]) {
                                if (!richText) return null;
                                return richText.map((t: any, i: number) => {
                                    const { annotations, text, href } = t;
                                    if (!text) return null;

                                    let content: React.ReactNode = text.content;

                                    if (annotations.bold) content = <strong key={i}>{content}</strong>;
                                    if (annotations.italic) content = <em key={i}>{content}</em>;
                                    if (annotations.strikethrough) content = <s key={i}>{content}</s>;
                                    if (annotations.underline) content = <u key={i}>{content}</u>;
                                    if (annotations.code) content = <code key={i} className={styles["blog-post__inline-code"]}>{content}</code>;

                                    if (href) {
                                        return (
                                            <a key={i} href={href} target="_blank" rel="noopener noreferrer">
                                                {content}
                                            </a>
                                        );
                                    }

                                    return <span key={i}>{content}</span>;
                                });
                            }

                            function renderList(list: { type: string; items: any[] }) {
                                const Tag = list.type as "ul" | "ol";
                                return (
                                    <Tag key={list.items[0].id}>
                                        {list.items.map((item) => (
                                            <li key={item.id}>
                                                {renderRichText(item[item.type]?.rich_text)}
                                            </li>
                                        ))}
                                    </Tag>
                                );
                            }

                            function renderBlock(block: any) {
                                switch (block.type) {
                                    case "paragraph":
                                        return (
                                            <p key={block.id}>
                                                {renderRichText(block.paragraph?.rich_text)}
                                            </p>
                                        );

                                    case "heading_1":
                                        return (
                                            <h1 key={block.id}>
                                                {renderRichText(block.heading_1?.rich_text)}
                                            </h1>
                                        );

                                    case "heading_2":
                                        return (
                                            <h2 key={block.id}>
                                                {renderRichText(block.heading_2?.rich_text)}
                                            </h2>
                                        );

                                    case "heading_3":
                                        return (
                                            <h3 key={block.id}>
                                                {renderRichText(block.heading_3?.rich_text)}
                                            </h3>
                                        );

                                    case "code":
                                        return (
                                            <pre key={block.id} className={styles["blog-post__code"]}>
                                                <code>
                                                    {block.code?.rich_text
                                                        ?.map((t: any) => t.plain_text)
                                                        .join("")}
                                                </code>
                                            </pre>
                                        );

                                    default:
                                        return null;
                                }
                            }
                        })()}
                    </section>
                </FluidContainer>
            </article>
        </main>

    );
}
