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
import { slugify } from "@dival-sehgal/utils/string";

/** TOC nesting: sections (H2) and subsections (H3+); see TableOfContents. */
const TOC_LEVEL = { section: 1, subsection: 3 } as const;
/** HTML has no heading level below h6. */
const MAX_HEADING_LEVEL = 6;

/**
 * Renderer for Contentful Rich Text
 * Enhanced for high-fidelity editorial design
 */


export function extractToc(content: ContentfulRichText) {
  if (!content?.json) {
    return [];
  }

  const headers: { id: string; text: string; level: number }[] = [];
  const seenIds = new Map<string, number>();

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
        const baseId = slugify(text);
        const count = seenIds.get(baseId) || 0;
        seenIds.set(baseId, count + 1);
        const id = count === 0 ? baseId : `${baseId}-${count}`;

        headers.push({
          id,
          text,
          level: node.nodeType === BLOCKS.HEADING_2 ? TOC_LEVEL.section : TOC_LEVEL.subsection,
        });
      }
    }
  });

  return headers;
}
const HEADING_LEVEL: Record<string, number> = {
  [BLOCKS.HEADING_1]: 1,
  [BLOCKS.HEADING_2]: 2,
  [BLOCKS.HEADING_3]: 3,
  [BLOCKS.HEADING_4]: 4,
  [BLOCKS.HEADING_5]: 5,
  [BLOCKS.HEADING_6]: 6,
};

export function renderContentfulRichText(content: ContentfulRichText) {
  if (!content?.json) {
    return null;
  }

  // Create a map for assets from the GraphQL links
  const assetMap = new Map<string, ContentfulAsset>();
  if (content.links?.assets?.block) {
    for (const asset of content.links.assets.block) {
      assetMap.set(asset.sys.id, asset);
    }
  }

  // Rank the heading levels this post actually uses: the shallowest becomes
  // <h2> (the page title is the only <h1>), the next <h3>, and so on, so the
  // outline never skips a level whatever the author picked (WCAG 1.3.1).
  const usedLevels = [
    ...new Set(
      (content.json.content ?? [])
        .map((node) => HEADING_LEVEL[node.nodeType])
        .filter((level): level is number => level !== undefined),
    ),
  ].sort((a, b) => a - b);
  const Heading = ({ level, id, children }: { level: number; id: string; children: ReactNode }) => {
    const rank = Math.max(usedLevels.indexOf(level), 0);
    const Tag = `h${Math.min(rank + 2, MAX_HEADING_LEVEL)}` as "h2" | "h3" | "h4" | "h5" | "h6";
    return <Tag id={id}>{children}</Tag>;
  };
  const headingText = (node: Block | Inline) =>
    (node as unknown as Block).content
      .filter((c): c is Text => c.nodeType === "text")
      .map((c) => c.value)
      .join("");

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
        const contentStr = typeof text === "string" ? text : String(text);
        // If it's multiline, wrap in our CodeBlock component
        if (contentStr?.includes("\n")) {
          return <CodeBlock content={contentStr}>{contentStr}</CodeBlock>;
        }
        return <code>{text}</code>;
      },
    },
    renderNode: {
      [BLOCKS.PARAGRAPH]: (node: Block | Inline, children: ReactNode) => {
        // Check if this paragraph contains a multiline code block
        // We use a div instead of a p tag if it does, because p cannot contain pre
        const hasCodeBlock = node.content.some(
          (c): c is Text =>
            c.nodeType === "text" &&
            c.marks?.some((m) => m.type === "code") &&
            c.value?.includes("\n"),
        );

        if (hasCodeBlock) {
          return <div>{children}</div>;
        }

        return <p>{children}</p>;
      },
      // The page's own <h1> is the post title (see BlogPost/index.tsx); body
      // headings are re-levelled by <Heading> above so they start at <h2>.
      [BLOCKS.HEADING_1]: (node: Block | Inline, children: ReactNode) => {
        const text = (node as unknown as Block).content
          .filter((c): c is Text => c.nodeType === "text")
          .map((c) => c.value)
          .join("");
        const id = getUniqueId(text);
        return <Heading level={1} id={id}>{children}</Heading>;
      },
      [BLOCKS.HEADING_2]: (node: Block | Inline, children: ReactNode) => {
        const text = (node as unknown as Block).content
          .filter((c): c is Text => c.nodeType === "text")
          .map((c) => c.value)
          .join("");
        const id = getUniqueId(text);
        return <Heading level={2} id={id}>{children}</Heading>;
      },
      [BLOCKS.HEADING_3]: (node: Block | Inline, children: ReactNode) => {
        const text = (node as unknown as Block).content
          .filter((c): c is Text => c.nodeType === "text")
          .map((c) => c.value)
          .join("");
        const id = getUniqueId(text);
        return <Heading level={3} id={id}>{children}</Heading>;
      },
      [BLOCKS.HEADING_4]: (node: Block | Inline, children: ReactNode) => (
        <Heading level={4} id={getUniqueId(headingText(node))}>{children}</Heading>
      ),
      [BLOCKS.HEADING_5]: (node: Block | Inline, children: ReactNode) => (
        <Heading level={5} id={getUniqueId(headingText(node))}>{children}</Heading>
      ),
      [BLOCKS.HEADING_6]: (node: Block | Inline, children: ReactNode) => (
        <Heading level={6} id={getUniqueId(headingText(node))}>{children}</Heading>
      ),
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
        <div style={{ overflowX: "auto", maxWidth: "100%", WebkitOverflowScrolling: "touch" }}>
          <table>
            <tbody>{children}</tbody>
          </table>
        </div>
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
