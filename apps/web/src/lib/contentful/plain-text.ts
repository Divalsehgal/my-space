import type { ContentfulRichText } from "@/types/contentful";

interface RichTextNode {
  nodeType: string;
  value?: string;
  content?: RichTextNode[];
}

export function contentfulToPlainText(richText: ContentfulRichText): string {
  if (!richText?.json?.content) {
    return "";
  }

  const extractText = (nodes: RichTextNode[]): string => {
    return nodes
      .map((node) => {
        if (node.nodeType === "text") {
          return node.value || "";
        }
        if (node.content) {
          return extractText(node.content);
        }
        return "";
      })
      .join(" ");
  };

  return extractText(richText.json.content as unknown as RichTextNode[])
    .replace(/\s+/g, " ")
    .trim();
}
