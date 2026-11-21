import { chunkSections, richTextToSections, type RichNode } from "./quiz-sections";

const text = (value: string, marks: string[] = []): RichNode => ({ nodeType: "text", value, marks: marks.map((type) => ({ type })) });
const block = (nodeType: string, ...content: RichNode[]): RichNode => ({ nodeType, content });
const para = (...content: RichNode[]) => block("paragraph", ...content);

describe("richTextToSections", () => {
  it("splits at H1/H2, keeps deeper headings and renders blocks as Markdown", () => {
    const body = {
      content: [
        para(text("Intro text.")),
        block("heading-2", text("Caching")),
        block("heading-3", text("Details")),
        para(text("Use "), text("max-age", ["code"]), text(".")),
        para(text("const a = 1;\nconst b = 2;", ["code"])),
        block("unordered-list", block("list-item", para(text("one"))), block("list-item", para(text("two")))),
        block("ordered-list", block("list-item", para(text("first")))),
        block("blockquote", para(text("quoted"))),
        block("table", block("table-row", block("table-cell", para(text("a"))), block("table-cell", para(text("b"))))),
        block("hr"),
        block("embedded-entry-block"),
        block("heading-1", text("Empty")),
      ],
    };
    expect(richTextToSections(body, "Post")).toEqual([
      { heading: "Post", text: "Intro text." },
      {
        heading: "Caching",
        text: "### Details\n\nUse `max-age`.\n\n```\nconst a = 1;\nconst b = 2;\n```\n\n- one\n- two\n\n1. first\n\n> quoted\n\n| a | b |",
      },
    ]);
  });

  it("returns nothing for an empty body", () => {
    expect(richTextToSections(undefined, "Post")).toEqual([]);
  });
});

describe("chunkSections", () => {
  it("joins neighbouring sections up to the limit and keeps an oversized one whole", () => {
    const sections = [
      { heading: "A", text: "a".repeat(10) },
      { heading: "B", text: "b".repeat(10) },
      { heading: "C", text: "c".repeat(50) },
    ];
    const chunks = chunkSections(sections, 40);
    expect(chunks.map((chunk) => chunk.heading)).toEqual(["A", "C"]);
    expect(chunks[0].text).toBe(`## A\n\n${"a".repeat(10)}\n\n## B\n\n${"b".repeat(10)}`);
    expect(chunks[1].text).toContain("c".repeat(50));
  });
});
