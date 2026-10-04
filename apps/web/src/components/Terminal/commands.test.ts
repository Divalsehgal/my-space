import { complete, runCommand } from "./commands";
import type { SiteIndex } from "@/lib/site-index";

const index: SiteIndex = {
  name: "Dival Sehgal",
  role: "Software Engineer",
  email: "hi@example.com",
  resumeUrl: "https://example.com/cv.pdf",
  about: ["Builds things."],
  socials: [{ label: "GitHub", href: "https://github.com/x" }],
  sections: [
    { id: "about", label: "About", href: "/#about" },
    { id: "projects", label: "Projects", href: "/#projects" },
  ],
  skills: ["React", "TypeScript", "Node.js"],
  experience: [{ role: "Engineer", company: "Acme Labs", period: "2022 – now" }],
  projects: [{ name: "Stack Game", description: "A tiny game", href: "https://example.com/game" }],
  posts: [{ title: "Hello World", slug: "hello-world" }],
};

describe("terminal commands", () => {
  it("lists help and rejects unknown commands", () => {
    expect(runCommand("help", index).lines[0]).toBe("Commands:");
    expect(runCommand("nope", index).lines[0]).toMatch(/command not found/);
    expect(runCommand("   ", index)).toEqual({ lines: [] });
  });

  it("navigates to sections with cd", () => {
    expect(runCommand("cd projects/", index).action).toEqual({ type: "navigate", href: "/#projects" });
    expect(runCommand("cd mars", index).action).toBeUndefined();
  });

  it("opens posts, projects and socials", () => {
    expect(runCommand("open hello", index).action).toEqual({ type: "navigate", href: "/blogs/hello-world" });
    expect(runCommand("open stack-game", index).action).toEqual({ type: "open", href: "https://example.com/game" });
    expect(runCommand("open github", index).action).toEqual({ type: "open", href: "https://github.com/x" });
    expect(runCommand("cat stack game", index).lines).toContain("A tiny game");
  });

  it("filters skills and hands questions to ask", () => {
    expect(runCommand("skills type", index).lines[0]).toContain("TypeScript");
    expect(runCommand("ask what stack?", index).action).toEqual({ type: "ask", question: "what stack?" });
    expect(runCommand("email", index).action).toEqual({ type: "copy", text: "hi@example.com" });
    expect(runCommand("theme dark", index).action).toEqual({ type: "theme", mode: "dark" });
  });

  it("tab-completes commands and targets", () => {
    expect(complete("exp", index)).toBe("experience ");
    expect(complete("cd pro", index)).toBe("cd projects");
    expect(complete("open hel", index)).toBe("open hello-world");
  });
});
