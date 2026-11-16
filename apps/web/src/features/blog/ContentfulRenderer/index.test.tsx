import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BLOCKS, INLINES } from "@contentful/rich-text-types";
import { extractToc, renderContentfulRichText } from ".";
import type { ContentfulRichText } from "@/types";

jest.mock("../AnimatedImageBlock", () => ({
  AnimatedImageBlock: ({ asset }: { asset: { title: string } }) => <span role="img" aria-label={asset.title} />,
}));

const text = (value: string, marks: string[] = []) => ({ nodeType: "text", value, marks: marks.map((type) => ({ type })), data: {} });
const block = (nodeType: string, content: unknown[] = [], data = {}) => ({ nodeType, content, data });

const doc = (content: unknown[], assets?: unknown[]) =>
  ({ json: { nodeType: "document", data: {}, content }, links: assets ? { assets: { block: assets } } : undefined }) as unknown as ContentfulRichText;

describe("extractToc", () => {
  it("collects h2/h3 with unique ids and skips empty headings", () => {
    const toc = extractToc(
      doc([
        block(BLOCKS.HEADING_2, [text("Intro")]),
        block(BLOCKS.HEADING_3, [text("Intro")]),
        block(BLOCKS.HEADING_2, [block(INLINES.HYPERLINK)]),
        block(BLOCKS.PARAGRAPH, [text("p")]),
      ]),
    );
    expect(toc).toEqual([
      { id: "intro", text: "Intro", level: 1 },
      { id: "intro-1", text: "Intro", level: 3 },
    ]);
  });

  it("keeps TOC ids aligned when preceding headings use other levels", () => {
    const content = doc([
      block(BLOCKS.HEADING_1, [text("Intro")]),
      block(BLOCKS.HEADING_2, [text("Intro")]),
    ]);

    expect(extractToc(content)).toEqual([{ id: "intro-1", text: "Intro", level: 1 }]);

    const { container } = render(<>{renderContentfulRichText(content)}</>);
    expect(container.querySelector("h3#intro-1")).toHaveTextContent("Intro");
  });

  it("returns [] without content", () => {
    expect(extractToc(undefined as never)).toEqual([]);
  });
});

describe("renderContentfulRichText", () => {
  it("returns null without content", () => {
    expect(renderContentfulRichText(undefined as never)).toBeNull();
  });

  it("renders every supported node and mark", () => {
    const content = doc(
      [
        block(BLOCKS.HEADING_1, [text("One")]),
        block(BLOCKS.HEADING_2, [text("Two")]),
        block(BLOCKS.HEADING_3, [text("Three")]),
        block(BLOCKS.HEADING_4, [text("Four")]),
        block(BLOCKS.HEADING_5, [text("Five")]),
        block(BLOCKS.HEADING_6, [text("Six")]),
        block(BLOCKS.HEADING_6, [text("Six")]),
        block(BLOCKS.PARAGRAPH, [text("bold", ["bold"]), text("it", ["italic"]), text("inline", ["code"])]),
        block(BLOCKS.PARAGRAPH, [text("a\nb", ["code"])]),
        block(BLOCKS.PARAGRAPH, [block(INLINES.HYPERLINK, [text("link")], { uri: "https://x.dev" })]),
        block(BLOCKS.UL_LIST, [block(BLOCKS.LIST_ITEM, [block(BLOCKS.PARAGRAPH, [text("ul item")])])]),
        block(BLOCKS.OL_LIST, [block(BLOCKS.LIST_ITEM, [block(BLOCKS.PARAGRAPH, [text("ol item")])])]),
        block(BLOCKS.QUOTE, [block(BLOCKS.PARAGRAPH, [text("quote")])]),
        block(BLOCKS.HR),
        block(BLOCKS.TABLE, [
          block(BLOCKS.TABLE_ROW, [block(BLOCKS.TABLE_HEADER_CELL, [block(BLOCKS.PARAGRAPH, [text("H")])])]),
          block(BLOCKS.TABLE_ROW, [block(BLOCKS.TABLE_CELL, [block(BLOCKS.PARAGRAPH, [text("C")])])]),
        ]),
        block(BLOCKS.EMBEDDED_ASSET, [], { target: { sys: { id: "img" } } }),
        block(BLOCKS.EMBEDDED_ASSET, [], { target: { sys: { id: "missing" } } }),
      ],
      [{ sys: { id: "img" }, title: "Diagram" }],
    );
    const { container } = render(<>{renderContentfulRichText(content)}</>);
    // The shallowest used level becomes <h2>; deeper ones are capped at <h6>.
    expect(screen.getByRole("heading", { name: "One", level: 2 })).toHaveAttribute("id", "one");
    expect(screen.getByRole("heading", { name: "Two", level: 3 })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "Six", level: 6 }).map((h) => h.id)).toEqual(["six", "six-1"]);
    expect(container.querySelector("strong")).toHaveTextContent("bold");
    expect(container.querySelector("em")).toHaveTextContent("it");
    expect(container.querySelector("code")).toHaveTextContent("inline");
    expect(container.querySelector("pre")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "link" })).toHaveAttribute("target", "_blank");
    expect(container.querySelectorAll("ul li, ol li")).toHaveLength(2);
    expect(container.querySelector("blockquote")).toHaveTextContent("quote");
    expect(container.querySelector("hr")).toBeInTheDocument();
    expect(container.querySelector("th")).toHaveTextContent("H");
    expect(container.querySelector("td")).toHaveTextContent("C");
    expect(screen.getAllByRole("img")).toHaveLength(1);
  });

  it("renders without asset links or heading nodes", () => {
    const { container } = render(<>{renderContentfulRichText(doc([block(BLOCKS.PARAGRAPH, [text("only")])]))}</>);
    expect(container.querySelector("p")).toHaveTextContent("only");
  });

  it("handles empty paragraphs as paragraph--empty spacers", () => {
    const { container } = render(<>{renderContentfulRichText(doc([block(BLOCKS.PARAGRAPH, [text("")])]))}</>);
    expect(container.querySelector("p.paragraph--empty")).toBeEmptyDOMElement();
  });

  it("keeps spacer paragraphs between code blocks outside the code containers", () => {
    const content = doc([
      block(BLOCKS.PARAGRAPH, [text("const first = true;\n", ["code"])]),
      block(BLOCKS.PARAGRAPH, [text("")]),
      block(BLOCKS.PARAGRAPH, [text("const second = false;\n", ["code"])]),
    ]);
    const { container } = render(<>{renderContentfulRichText(content)}</>);
    const wrappers = container.querySelectorAll(".code-block-wrapper");
    const spacer = wrappers[0]?.nextElementSibling;

    expect(wrappers).toHaveLength(2);
    expect(spacer).toHaveClass("paragraph--empty");
    expect(spacer).toBeEmptyDOMElement();
    expect(spacer?.nextElementSibling).toBe(wrappers[1]);
  });

  it("preserves code block whitespace and wraps in code-block-wrapper", () => {
    const code = "const x = 10;\nconst y = 20;\n\n   ";
    const { container } = render(
      <>{renderContentfulRichText(doc([block(BLOCKS.PARAGRAPH, [text(code, ["code"])])]))}</>,
    );
    expect(container.querySelector(".code-block-wrapper")).toBeInTheDocument();
    expect(container.querySelector("code")?.textContent).toBe(code);
  });
});
