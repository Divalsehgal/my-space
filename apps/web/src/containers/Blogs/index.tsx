"use client";

import { useState, useMemo, useEffect, ChangeEvent, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import FluidContainer from "@/components/FluidContainer";
import Carousel from "@/components/Carousel";
import Breadcrumbs from "@/components/Breadcrumbs";
import { NotionBlogPost } from "@/lib/services/notion";
import styles from "./styles.module.scss";

type BlogPageContentProps = {
    posts: NotionBlogPost[];
};

export default function BlogPageContent({ posts }: Readonly<BlogPageContentProps>) {
    const [inputValue, setInputValue] = useState("");
    const [deferredQuery, setDeferredQuery] = useState("");
    const [isPending, startTransition] = useTransition();

    const changeHandler = (e: ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
        startTransition(() => {
            setDeferredQuery(e.target.value);
        });
    };

    useEffect(() => {
        const html = document.documentElement;
        html.style.scrollBehavior = "auto";
        window.scrollTo(0, 0);
    }, []);

    const featuredPosts = useMemo(() => posts.slice(0, 5), [posts]);

    const filteredPosts = useMemo(() => {
        const query = deferredQuery.toLowerCase();
        return posts.filter((post) => {
            const matchesSearch = post.title.toLowerCase().includes(query) ||
                post.description?.toLowerCase().includes(query) ||
                post.tags.some(tag => tag.toLowerCase().includes(query));

            return matchesSearch;
        });
    }, [posts, deferredQuery]);

    const renderCarouselItem = (post: NotionBlogPost) => (
        <Link href={`/blogs/${post.slug}`} className={styles["blogs__card"]} key={post.id}>
            {post.cover && (
                <div className={styles["blogs__card-image"]} style={{ backgroundImage: `url(${post.cover})` }} />
            )}
            <div className={styles["blogs__card-content"]}>
                {post.date && (
                    <p className={styles["blogs__card-date"]}>
                        {new Date(post.date).toLocaleDateString("en-US")}
                    </p>
                )}
                <h2 className={styles["blogs__card-title"]}>{post.title}</h2>
                {post.description && <p className={styles["blogs__card-excerpt"]}>{post.description}</p>}
                <div className={styles["blogs__card-link"]}>
                    Read More <span>→</span>
                </div>
            </div>
        </Link>
    );

    const breadcrumbItems = [
        { label: "Blogs", href: "/blogs" },
    ];

    return (
        <>
            <FluidContainer>
                <div className={styles["blogs__header"]}>
                    <h1 className={styles["blogs__title"]}>Our Blog</h1>
                    <p className={styles["blogs__description"]}>Insights, and stories from the world of technology.</p>
                </div>

                {/* Featured Carousel */}
                {featuredPosts.length > 0 && (
                    <div style={{ marginBottom: '4rem' }}>
                        <Carousel
                            sectionTitle="Top Posts"
                            items={featuredPosts}
                            renderItem={renderCarouselItem}
                            progressLabelPrefix="Post"
                            showNavigation={false}
                            showProgress={false}
                            showDots={true}
                            autoPlay={true}
                        />
                    </div>
                )}


                {/* Search and All Posts */}
                <div>
                    <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <h2 className={styles["blogs__title"]} style={{ fontSize: '2rem', marginBottom: 0 }}>All Posts</h2>
                        <input
                            type="text"
                            placeholder="Search posts..."
                            value={inputValue}
                            onChange={changeHandler}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '9999px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(255,255,255,0.05)',
                                color: 'white',
                                width: '100%',
                                maxWidth: '300px'
                            }}
                        />
                    </div>

                    <div className={styles["blogs__grid"]}>
                        {isPending ? (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem' }}>
                                <h3 className={styles["blogs__title"]}>Searching for posts...</h3>
                            </div>
                        ) : filteredPosts.length > 0 ? (
                            filteredPosts.map((post) => (
                                <Link key={post.id} href={`/blogs/${post.slug}`} className={styles["blogs__card"]}>
                                    {post.cover && (
                                        <div className={styles["blogs__card-image"]} style={{ backgroundImage: `url(${post.cover})` }} />
                                    )}
                                    <div className={styles["blogs__card-content"]}>
                                        {post.date && (
                                            <p className={styles["blogs__card-date"]}>
                                                {new Date(post.date).toLocaleDateString("en-US")}
                                            </p>
                                        )}
                                        <h2 className={styles["blogs__card-title"]}>{post.title}</h2>
                                        {post.description && <p className={styles["blogs__card-excerpt"]}>{post.description}</p>}
                                        <div className={styles["blogs__card-link"]}>
                                            Read More <span>→</span>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>No posts found matching your search.</p>
                        )}
                    </div>
                </div>
            </FluidContainer>
        </>
    );
}
