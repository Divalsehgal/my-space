import { getTierInfo, plainText } from "./types";
import { createTranslator } from "@/i18n/core";
import type { ContentfulRichText } from "@/types";

describe("plainText", () => {
  it("returns empty for missing input and passes strings through", () => {
    expect(plainText(undefined)).toBe("");
    expect(plainText(null)).toBe("");
    expect(plainText("plain")).toBe("plain");
  });

  it("flattens rich text nodes into one spaced string", () => {
    const rich = {
      json: {
        nodeType: "document",
        content: [
          { nodeType: "paragraph", content: [{ nodeType: "text", value: "Hello" }, { nodeType: "text", value: " world " }] },
          { nodeType: "paragraph", content: [null, { nodeType: "text", value: "again" }] },
          { nodeType: "hr" },
        ],
      },
    } as unknown as ContentfulRichText;
    expect(plainText(rich)).toBe("Hello world again");
  });
});

describe("getTierInfo", () => {
  const t = createTranslator();

  it.each([
    [100, "perfect", "success"],
    [80, "strong", "info"],
    [50, "good", "warning"],
    [10, "retry", "error"],
    [-5, "retry", "error"],
  ])("maps %i%% to the %s tier", (percentage, id, tone) => {
    const info = getTierInfo(percentage, t);
    expect(info.badge).toBe(t(`quiz.tier.${id}.badge` as never));
    expect(info.color).toBe(`var(--t-colors-feedback-${tone}-text)`);
    expect(info.bgColor).toBe(`var(--t-colors-feedback-${tone}-surface)`);
  });
});
