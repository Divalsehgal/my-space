/**
 * Turns a blog's rich-text body into Markdown sections (split at H1/H2
 * headings) and groups them into chunks small enough for a free model's
 * context, for quiz generation (quiz-generate.ts).
 */

/** ~3k tokens: fits comfortably in any free model's context. */
const MAX_CHUNK_CHARS = 12_000;
const HEADING_LEVEL = /^heading-(\d)$/;
/** H1 and H2 start a new section; deeper headings stay inside their section. */
const MAX_SECTION_HEADING_LEVEL = 2;

export interface Section {
  heading: string;
  text: string;
}

export interface RichNode {
  nodeType: string;
  value?: string;
  marks?: { type: string }[];
  content?: RichNode[];
}

const inlineText = (nodes: RichNode[] = []): string =>
  nodes
    .map((node) => {
      if (node.nodeType !== "text") { return inlineText(node.content); }
      const value = node.value ?? "";
      if (!node.marks?.some((mark) => mark.type === "code")) { return value; }
      // Code-marked text with line breaks is a code block in this blog's editor.
      return value.includes("\n") ? `\n\`\`\`\n${value.trim()}\n\`\`\`\n` : `\`${value}\``;
    })
    .join("");

function blockText(node: RichNode): string {
  const level = HEADING_LEVEL.exec(node.nodeType)?.[1];
  if (level) { return `${"#".repeat(Number(level))} ${inlineText(node.content)}`; }
  switch (node.nodeType) {
    case "unordered-list":
    case "ordered-list":
      return (node.content ?? []).map((item, index) => `${node.nodeType === "ordered-list" ? `${index + 1}.` : "-"} ${(item.content ?? []).map(blockText).join(" ")}`).join("\n");
    case "blockquote":
      return (node.content ?? []).map((child) => `> ${blockText(child)}`).join("\n");
    case "table":
      return (node.content ?? []).map((row) => `| ${(row.content ?? []).map((cell) => inlineText(cell.content)).join(" | ")} |`).join("\n");
    case "hr":
    case "embedded-asset-block":
    case "embedded-entry-block":
      return "";
    default:
      return inlineText(node.content);
  }
}

/** Splits a rich-text body into Markdown sections at its H1/H2 headings. */
export function richTextToSections(body: { content?: RichNode[] } | undefined, title: string): Section[] {
  const sections: Section[] = [{ heading: title, text: "" }];
  for (const node of body?.content ?? []) {
    const level = Number(HEADING_LEVEL.exec(node.nodeType)?.[1]);
    if (level && level <= MAX_SECTION_HEADING_LEVEL) {
      sections.push({ heading: inlineText(node.content).trim(), text: "" });
      continue;
    }
    const text = blockText(node).trim();
    if (text) { sections[sections.length - 1].text += `${text}\n\n`; }
  }
  return sections.map((section) => ({ ...section, text: section.text.trim() })).filter((section) => section.text);
}

/** Groups neighbouring sections into chunks of at most MAX_CHUNK_CHARS (a longer single section stays whole). */
export function chunkSections(sections: Section[], maxChars = MAX_CHUNK_CHARS): Section[] {
  const chunks: Section[] = [];
  for (const section of sections) {
    const last = chunks.at(-1);
    const piece = `## ${section.heading}\n\n${section.text}`;
    if (last && last.text.length + piece.length <= maxChars) {
      last.text += `\n\n${piece}`;
    } else {
      chunks.push({ heading: section.heading, text: piece });
    }
  }
  return chunks;
}
