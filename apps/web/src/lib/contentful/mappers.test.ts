import { mapContentfulPost, type ContentfulPostItem } from "./mappers";
import type { ContentfulRichText } from "@/types/contentful";

const rich = (content: unknown[]) => ({ json: { nodeType: "document", content } }) as unknown as ContentfulRichText;
const text = (value?: string) => ({ nodeType: "text", value });
const para = (...values: string[]) => ({ nodeType: "paragraph", content: values.map((v) => text(v)) });

const base: ContentfulPostItem = {
  sys: { id: "p1", firstPublishedAt: "2024-01-01", publishedAt: "2024-02-01" },
  title: "Post",
  slug: "post",
  body: rich([]),
};

describe("mapContentfulPost", () => {
  it("maps core fields with no quiz", () => {
    expect(mapContentfulPost(base)).toEqual({
      id: "p1",
      title: "Post",
      cover: null,
      date: "2024-01-01",
      publishedAt: "2024-02-01",
      slug: "post",
      description: "",
      tags: [],
      content: base.body,
      quiz: null,
    });
  });

  it("builds a description from paragraphs, headings and nested lists", () => {
    const body = rich([
      { nodeType: "heading-2", content: [text("Intro")] },
      para("Hello   ", "world!"),
      { nodeType: "unordered-list", content: [{ nodeType: "list-item", content: [para("Item one")] }] },
      para(""),
      { nodeType: "hr" },
      { nodeType: "paragraph", content: [{ nodeType: "hyperlink", content: [text("Link"), text()] }] },
    ]);
    expect(mapContentfulPost({ ...base, body }).description).toBe("Intro. Hello world! Item one. Link.");
  });

  it("truncates long descriptions on a word boundary", () => {
    const words = Array.from({ length: 60 }, (_, i) => `word${i},`).join(" ");
    const description = mapContentfulPost({ ...base, body: rich([para(words)]) }).description;
    expect(description.length).toBeLessThanOrEqual(156);
    expect(description.endsWith("…")).toBe(true);
    expect(description).not.toMatch(/,…$/);
  });

  it("returns an empty description without a body", () => {
    expect(mapContentfulPost({ ...base, body: undefined as unknown as ContentfulRichText }).description).toBe("");
  });

  it("maps quiz questions, skipping incomplete questions and null options", () => {
    const q = rich([para("Q?")]);
    const post = mapContentfulPost({
      ...base,
      quiz: {
        sys: { id: "quiz" },
        title: "Quiz",
        questionEntriesCollection: {
          items: [
            {
              sys: { id: "q1" },
              questionText: q,
              explanation: q,
              correctAnswer: { sys: { id: "o1" } },
              optionsCollection: { items: [{ sys: { id: "o1" }, text: q }, null] },
            },
            { sys: { id: "q2" }, questionText: q, explanation: q, correctAnswer: { sys: { id: "x" } } },
            null,
            { sys: { id: "q3" }, questionText: q, explanation: undefined as unknown as ContentfulRichText, correctAnswer: { sys: { id: "x" } } },
          ],
        },
      },
    });
    expect(post.quiz).toEqual({
      id: "quiz",
      title: "Quiz",
      questions: [
        { id: "q1", questionText: q, explanation: q, correctAnswerId: "o1", options: [{ id: "o1", text: q }] },
        { id: "q2", questionText: q, explanation: q, correctAnswerId: "x", options: [] },
      ],
    });
  });

  it("handles a quiz without questions", () => {
    expect(mapContentfulPost({ ...base, quiz: { sys: { id: "z" }, title: "Z" } }).quiz).toEqual({ id: "z", title: "Z", questions: [] });
  });
});
