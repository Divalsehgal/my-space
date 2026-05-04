import React from "react";
import Image from "next/image";
import styles from "@/app/blogs/[slug]/styles.module.scss";
import type { BlockObjectResponse, RichTextItemResponse } from "@notionhq/client/build/src/api-endpoints";

/**
 * Renders rich text from Notion with proper annotations and links
 */
export function renderRichText(richText: RichTextItemResponse[] | undefined) {
    if (!richText) {
        return null;
    }
    return richText.map((t, i) => {
        const { annotations, plain_text: plainText, href } = t;

        let content: React.ReactNode = plainText;

        if (annotations.bold) {
            content = <strong key={i}>{content}</strong>;
        }
        if (annotations.italic) {
            content = <em key={i}>{content}</em>;
        }
        if (annotations.strikethrough) {
            content = <s key={i}>{content}</s>;
        }
        if (annotations.underline) {
            content = <u key={i}>{content}</u>;
        }
        if (annotations.code) {
            content = <code key={i} className={styles["blog-post__inline-code"]}>{content}</code>;
        }

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

/**
 * Renders a list (bulleted or numbered)
 */
export function renderList(list: { type: "bulleted_list_item" | "numbered_list_item"; items: BlockObjectResponse[] }) {
    const Tag = list.type === "bulleted_list_item" ? "ul" : "ol";
    return (
        <Tag>
            {list.items.map((item) => {
                let content: RichTextItemResponse[] = [];
                if (item.type === "bulleted_list_item") {
                    content = item.bulleted_list_item.rich_text;
                } else if (item.type === "numbered_list_item") {
                    content = item.numbered_list_item.rich_text;
                }
                return (
                    <li key={item.id}>
                        {renderRichText(content)}
                    </li>
                );
            })}
        </Tag>
    );
}

/**
 * Renders text-based blocks
 */
function renderTextContent(block: BlockObjectResponse) {
    switch (block.type) {
        case "paragraph":
            return <p key={block.id}>{renderRichText(block.paragraph.rich_text)}</p>;
        case "heading_1":
            return <h1 key={block.id}>{renderRichText(block.heading_1.rich_text)}</h1>;
        case "heading_2":
            return <h2 key={block.id}>{renderRichText(block.heading_2.rich_text)}</h2>;
        case "heading_3":
            return <h3 key={block.id}>{renderRichText(block.heading_3.rich_text)}</h3>;
        case "quote":
            return (
                <blockquote key={block.id}>
                    <p>{renderRichText(block.quote.rich_text)}</p>
                </blockquote>
            );
        default:
            return null;
    }
}

/**
 * Renders an image block
 */
function renderImageBlock(block: BlockObjectResponse & { type: "image" }) {
    const url = block.image.type === 'external' ? block.image.external.url : block.image.file.url;
    const caption = block.image.caption?.[0]?.plain_text || "";
    return (
        <figure key={block.id} className={styles["blog-post__image-container"]}>
            <Image
                src={url}
                alt={caption || "Blog post image"}
                width={800}
                height={450}
                className={styles["blog-post__image"]}
            />
            {caption && (
                <figcaption className={styles["blog-post__image-caption"]}>
                    {caption}
                </figcaption>
            )}
        </figure>
    );
}

/**
 * Renders a single Notion block
 */
export function renderBlock(block: BlockObjectResponse) {
    if (["paragraph", "heading_1", "heading_2", "heading_3", "quote"].includes(block.type)) {
        return renderTextContent(block as BlockObjectResponse);
    }

    switch (block.type) {
        case "code":
            return (
                <pre key={block.id} className={styles["blog-post__code"]}>
                    <code>
                        {block.code.rich_text.map((t) => t.plain_text).join("")}
                    </code>
                </pre>
            );

        case "divider":
            return <hr key={block.id} />;

        case "image":
            return renderImageBlock(block as BlockObjectResponse & { type: "image" });

        default:
            return null;
    }
}
