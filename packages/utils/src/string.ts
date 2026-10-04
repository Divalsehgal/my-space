/** URL/id-safe slug: "Next.js & React!" → "nextjs-react". Used for heading anchors and terminal names. */
export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      // Trim edge hyphens without a backtracking regex (collapsed above, so at most one).
      .replace(/^-/, "")
      .replace(/-$/, "")
  );
}

/** Splits multi-paragraph text (paragraphs separated by a blank line) into trimmed, non-empty paragraphs. */
export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

/** Zero-pads a counter for display: 3 → "03". */
export function padNumber(value: number, width = 2): string {
  return String(value).padStart(width, "0");
}
