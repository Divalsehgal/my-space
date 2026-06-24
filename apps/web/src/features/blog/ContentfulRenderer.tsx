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
import { AnimatedImageBlock } from "./AnimatedImageBlock";
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
  const seenIds = new Map<string, number>();

  content.json.content.forEach((node) => {
    if (
      node.nodeType === BLOCKS.HEADING_1 ||
      node.nodeType === BLOCKS.HEADING_3
    ) {
      const text = node.content
        .filter((c): c is Text => c.nodeType === "text")
        .map((c) => c.value)
        .join("");

      if (text) {
        const baseId = slugify(text);
        const count = seenIds.get(baseId) || 0;
        seenIds.set(baseId, count + 1);
        const id = count === 0 ? baseId : `${baseId}-${count}`;

        headers.push({
          id,
          text,
          level: node.nodeType === BLOCKS.HEADING_1 ? 1 : 3,
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

  const seenIds = new Map<string, number>();

  const getUniqueId = (text: string) => {
    const baseId = slugify(text);
    const count = seenIds.get(baseId) || 0;
    seenIds.set(baseId, count + 1);
    return count === 0 ? baseId : `${baseId}-${count}`;
  };

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
      [BLOCKS.HEADING_1]: (node: Block | Inline, children: ReactNode) => {
        const text = (node as Block).content
          .filter((c): c is Text => c.nodeType === "text")
          .map((c) => c.value)
          .join("");
        const id = getUniqueId(text);
        return <h1 id={id}>{children}</h1>;
      },
      [BLOCKS.HEADING_2]: (node: Block | Inline, children: ReactNode) => {
        const text = (node as Block).content
          .filter((c): c is Text => c.nodeType === "text")
          .map((c) => c.value)
          .join("");
        // H2 is not in TOC anymore, but if it has duplicate text we just give it normal slugify
        // to avoid desyncing the seenIds count (which only tracks TOC items).
        // Wait, does HEADING_2 affect the count? extractToc only looks at H1 and H3.
        // So we should NOT increment the counter for H2 to keep it perfectly synced!
        const id = slugify(text);
        return <h2 id={id}>{children}</h2>;
      },
      [BLOCKS.HEADING_3]: (node: Block | Inline, children: ReactNode) => {
        const text = (node as Block).content
          .filter((c): c is Text => c.nodeType === "text")
          .map((c) => c.value)
          .join("");
        const id = getUniqueId(text);
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

        return <AnimatedImageBlock asset={asset} />;
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
