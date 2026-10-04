import { buildItems, score } from "./items";
import type { SiteIndex } from "@/lib/site-index";

const index: SiteIndex = {
  name: "Dival",
  role: "Engineer",
  about: [],
  socials: [{ label: "LinkedIn", href: "https://linkedin.com/in/x" }],
  sections: [{ id: "projects", label: "Projects", href: "/#projects" }],
  skills: [],
  experience: [],
  projects: [{ name: "No link", description: "hidden" }],
  posts: [{ title: "React Server Components", slug: "rsc" }],
};

describe("command palette items", () => {
  const items = buildItems(index);

  it("builds actions, sections, posts and socials, skipping link-less projects", () => {
    expect(items.map((i) => i.id)).toEqual(expect.arrayContaining(["a-terminal", "s-projects", "p-rsc", "so-LinkedIn"]));
    expect(items.some((i) => i.group === "Projects")).toBe(false);
    expect(items.some((i) => i.id === "a-email")).toBe(false);
  });

  it("ranks substring matches above subsequence matches", () => {
    const post = items.find((i) => i.id === "p-rsc")!;
    expect(score("", post)).toBe(0);
    expect(score("server", post)).toBeGreaterThan(score("rsc", post) ?? 0);
    expect(score("zzz", post)).toBeNull();
  });

  it("matches keywords", () => {
    const terminal = items.find((i) => i.id === "a-terminal")!;
    expect(score("shell", terminal)).not.toBeNull();
  });
});
