import { generateRobots, AI_CRAWLERS } from "./seo";

jest.mock("@/lib/services/contentful", () => ({ getContentfulPosts: jest.fn() }));

describe("generateRobots", () => {
  it("explicitly allows AI crawlers and keeps previews disallowed for them", () => {
    const rules = generateRobots().rules as { userAgent: string | string[]; allow: string; disallow: string[] }[];
    const ai = rules.find((rule) => Array.isArray(rule.userAgent));
    expect(ai?.userAgent).toEqual(AI_CRAWLERS);
    expect(ai?.allow).toBe("/");
    expect(ai?.disallow).toContain("/preview/");
  });
});
