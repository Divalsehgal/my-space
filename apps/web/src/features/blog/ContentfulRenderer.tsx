import {
  documentToReactComponents,
  Options,
} from "@contentful/rich-text-react-renderer";
import {
  BLOCKS,
  INLINES,
  MARKS,
  Block,
  Inline,
  Text,
} from "@contentful/rich-text-types";
import { ReactNode } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { CodeBlock } from "@/components/CodeBlock";
import type { ContentfulRichText, ContentfulAsset } from "@/types";

/**
 * Renderer for Contentful Rich Text
 * Enhanced for high-fidelity editorial design
 */

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function extractToc(content: ContentfulRichText) {
  if (!content || !content.json) {
    return [];
  }

  const headers: { id: string; text: string; level: number }[] = [];

  content.json.content.forEach((node) => {
    if (
      node.nodeType === BLOCKS.HEADING_2 ||
      node.nodeType === BLOCKS.HEADING_3
    ) {
      const text = node.content
        .filter((c): c is Text => c.nodeType === "text")
        .map((c) => c.value)
        .join("");

      if (text) {
        headers.push({
          id: slugify(text),
          text,
          level: node.nodeType === BLOCKS.HEADING_2 ? 2 : 3,
        });
      }
    }
  });

  return headers;
}
export function renderContentfulRichText(content: ContentfulRichText) {
  if (!content || !content.json) {
    return null;
  }

  // Create a map for assets from the GraphQL links
  const assetMap = new Map<string, ContentfulAsset>();
  if (content.links?.assets?.block) {
    for (const asset of content.links.assets.block) {
      assetMap.set(asset.sys.id, asset);
    }
  }

  const options: Options = {
    renderMark: {
      [MARKS.BOLD]: (text: ReactNode) => <strong>{text}</strong>,
      [MARKS.ITALIC]: (text: ReactNode) => <em>{text}</em>,
      [MARKS.CODE]: (text: ReactNode) => {
        const contentStr = text?.toString() || "";
        // If it's multiline, wrap in our CodeBlock component
        if (contentStr.includes("\n")) {
          return <CodeBlock content={contentStr}>{text}</CodeBlock>;
        }
        return <code>{text}</code>;
      },
    },
    renderNode: {
      [BLOCKS.PARAGRAPH]: (node: Block | Inline, children: ReactNode) => {
        // Check if this paragraph contains a multiline code block
        // We use a div instead of a p tag if it does, because p cannot contain pre
        const hasCodeBlock = node.content.some(
          (c) =>
            c.nodeType === "text" &&
            (c as Text).marks?.some((m) => m.type === "code") &&
            (c as Text).value?.includes("\n"),
        );

        if (hasCodeBlock) {
          return <div>{children}</div>;
        }

        return <p>{children}</p>;
      },
      [BLOCKS.HEADING_1]: (_node: Block | Inline, children: ReactNode) => (
        <h1>{children}</h1>
      ),
      [BLOCKS.HEADING_2]: (node: Block | Inline, children: ReactNode) => {
        const text = (node as Block).content
          .filter((c): c is Text => c.nodeType === "text")
          .map((c) => c.value)
          .join("");
        const id = slugify(text);
        return <h2 id={id}>{children}</h2>;
      },
      [BLOCKS.HEADING_3]: (node: Block | Inline, children: ReactNode) => {
        const text = (node as Block).content
          .filter((c): c is Text => c.nodeType === "text")
          .map((c) => c.value)
          .join("");
        const id = slugify(text);
        return <h3 id={id}>{children}</h3>;
      },
      [BLOCKS.UL_LIST]: (_node: Block | Inline, children: ReactNode) => (
        <ul>{children}</ul>
      ),
      [BLOCKS.OL_LIST]: (_node: Block | Inline, children: ReactNode) => (
        <ol>{children}</ol>
      ),
      [BLOCKS.LIST_ITEM]: (_node: Block | Inline, children: ReactNode) => (
        <li>{children}</li>
      ),
      [BLOCKS.QUOTE]: (_node: Block | Inline, children: ReactNode) => (
        <blockquote>{children}</blockquote>
      ),
      [BLOCKS.HR]: () => <hr />,
      [BLOCKS.TABLE]: (_node: Block | Inline, children: ReactNode) => (
        <table>
          <tbody>{children}</tbody>
        </table>
      ),
      [BLOCKS.TABLE_ROW]: (_node: Block | Inline, children: ReactNode) => (
        <tr>{children}</tr>
      ),
      [BLOCKS.TABLE_CELL]: (_node: Block | Inline, children: ReactNode) => (
        <td>{children}</td>
      ),
      [BLOCKS.TABLE_HEADER_CELL]: (
        _node: Block | Inline,
        children: ReactNode,
      ) => <th>{children}</th>,
      [BLOCKS.EMBEDDED_ASSET]: (node: Block | Inline) => {
        const id = (node.data.target as { sys: { id: string } }).sys.id;
        const asset = assetMap.get(id);

        if (!asset) {
          return null;
        }

        return (
          <motion.figure
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Image
              src={asset.url}
              alt={asset.title || "Blog image"}
              width={asset.width || 800}
              height={asset.height || 450}
            />
            {asset.title && <figcaption>{asset.title}</figcaption>}
          </motion.figure>
        );
      },
      [INLINES.HYPERLINK]: (node: Block | Inline, children: ReactNode) => (
        <a
          href={node.data.uri as string}
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      ),
    },
  };

  return documentToReactComponents(content.json, options);
}
