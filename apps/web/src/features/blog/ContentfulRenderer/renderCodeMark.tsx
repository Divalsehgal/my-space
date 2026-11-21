import type { ReactNode } from "react";
import { CodeBlock } from "@/components/CodeBlock";

/** Renders Contentful's code mark: inline <code>, or a CodeBlock when it spans lines. */
export function renderCodeMark(text: ReactNode) {
  if (typeof text !== "string") {
    return <code>{text}</code>;
  }
  // Contentful gives the code mark to spaces/newlines typed right after
  // the code, so keep edge whitespace outside the code element.
  const body = text.trim();
  if (!body) {
    return text;
  }
  if (text.includes("\n")) {
    // Keep first-line indentation; only drop leading blank lines.
    const code = text.replace(/^\s*\n/, "").trimEnd();
    // The first trailing newline just ends the block; each extra one is a blank line.
    const blankLines = Math.max((text.slice(text.trimEnd().length).match(/\n/g)?.length ?? 0) - 1, 0);
    return (
      <>
        <CodeBlock content={code}>{code}</CodeBlock>
        {Array.from({ length: blankLines }, (_, i) => (
          <div key={i} className="paragraph--empty" aria-hidden="true" />
        ))}
      </>
    );
  }
  const lead = text.slice(0, text.length - text.trimStart().length);
  const trail = text.slice(text.trimEnd().length);
  return <>{lead}<code>{body}</code>{trail}</>;
}
