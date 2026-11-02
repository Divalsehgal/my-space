/** @jest-environment node */
import { siteIndex } from "./reply";
import type { Catalog } from "./types";

describe("siteIndex", () => {
  it("lists posts, projects, roles and skills so list/skill questions don't depend on retrieval", () => {
    const catalog = {
      blogs: [{ title: "Web Security", slug: "web-security", date: "2026-05-05T00:00:00Z" }],
      projects: [{ name: "FE Grind", link: "https://fe.example" }],
      experience: [{ role: "Senior", company: "Acme", period: "2024 - Present" }],
      skills: { languages: ["TypeScript (Expert)", "Python (Advanced)"] },
    } as unknown as Catalog;
    const index = siteIndex(catalog);
    expect(index).toContain("- [Web Security](/blogs/web-security) (2026-05-05)");
    expect(index).toContain("- FE Grind (https://fe.example)");
    expect(index).toContain("- Senior at Acme, 2024 - Present");
    expect(index).toContain("- languages: TypeScript (Expert), Python (Advanced)");
    expect(siteIndex(null)).toBe("");
  });
});
