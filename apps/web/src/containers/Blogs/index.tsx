"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import FluidContainer from "@/components/FluidContainer";
import Carousel from "@/components/Carousel";
import { NotionBlogPost } from "@/lib/services/notion";
import styles from "./styles.module.scss";

type BlogPageContentProps = {
    posts: NotionBlogPost[];
};

export default function BlogPageContent({ posts }: Readonly<BlogPageContentProps>) {
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const html = document.documentElement;
        // Safeguard: explicitly remove any snap classes that might have leaked
        html.classList.remove("snap-mandatory");
        html.classList.remove("snap-proximity");
        html.style.scrollBehavior = "auto";
        window.scrollTo(0, 0);
    }, []);

    const featuredPosts = useMemo(() => posts.slice(0, 5), [posts]);

    const filteredPosts = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return posts.filter((post) => {
            const matchesSearch = post.title.toLowerCase().includes(query) ||
                post.description?.toLowerCase().includes(query) ||
                post.tags.some(tag => tag.toLowerCase().includes(query));
            
            return matchesSearch;
        });
    }, [posts, searchQuery]);

    const renderCarouselItem = (post: NotionBlogPost) => (
        <Link href={`/blogs/${post.slug}`} className={styles["blogs__carousel-item"]} key={post.id}>
            <h2>{post.title}</h2>
            {post.description && <p>{post.description}</p>}
            <div className={styles["blogs__tags"]} style={{ marginTop: '2rem', justifyContent: 'center' }}>
                {post.tags.map(tag => (
                    <span key={tag} className={styles["blogs__tag"]}>{tag}</span>
                ))}
            </div>
        </Link>
    );

    return (
        <FluidContainer className={styles.blogs || "blogs"}>
            <div className={styles["blogs__container"]}>
                <div className={styles["blogs__header"]}>
                    <h1 className={styles["blogs__main-title"]}>Our Blog</h1>
                    <p className={styles["blogs__subtitle"]}>Insights, and stories from the world of technology.</p>
                </div>

                {/* Featured Carousel */}
                {featuredPosts.length > 0 && (
                    <div className={styles["blogs__section"]}>
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
                <div className={styles["blogs__section"]}>
                    <div className={styles["blogs__search-section"]}>
                        <h2 className={styles["blogs__section-title"]}>All Posts</h2>
                        <div className={styles["blogs__filters-container"]}>
                            <input
                                type="text"
                                placeholder="Search posts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={styles["blogs__search-input"]}
                            />
                        </div>
                    </div>

                    <div className={styles["blogs__grid"]}>
                        {filteredPosts.length > 0 ? (
                            filteredPosts.map((post) => (
                                <Link key={post.id} href={`/blogs/${post.slug}`} className={styles["blogs__card"]}>
                                    {post.cover && (
                                        <div className={styles["blogs__card-image"]}>
                                            <Image
                                                src={post.cover}
                                                alt={post.title}
                                                fill
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                className={styles["blogs__post-image"]}
                                            />
                                        </div>
                                    )}
                                    <div className={styles["blogs__card-content"]}>
                                        <h2 className={styles["blogs__post-title"]}>{post.title}</h2>
                                         {post.date && (
                                            <p className={styles["blogs__post-date"]}>
                                                {new Date(post.date).toLocaleDateString("en-US")}
                                            </p>
                                        )}
                                        {post.description && <p className={styles["blogs__post-description"]}>{post.description}</p>}
                                        <div className={styles["blogs__tags"]}>
                                            {post.tags.map((tag) => (
                                                <span key={tag} className={styles["blogs__tag"]}>{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <p>No posts found matching your search.</p>
                        )}
                    </div>
                </div>
            </div>
        </FluidContainer>
    );
}
