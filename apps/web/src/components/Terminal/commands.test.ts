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

  it("lists sections, projects, posts and skills", () => {
    expect(runCommand("ls", index).lines).toEqual(["  about/", "  projects/"]);
    expect(runCommand("ls sections", index).lines).toEqual(["  about/", "  projects/"]);
    expect(runCommand("ls projects", index).lines[0]).toBe("  stack-game  A tiny game…");
    expect(runCommand("ls posts", index).lines).toEqual(["  hello-world"]);
    expect(runCommand("ls blog", index).lines).toEqual(["  hello-world"]);
    expect(runCommand("ls SKILLS", index).lines).toEqual(["  React, TypeScript, Node.js"]);
    expect(runCommand("ls mars", index).lines[0]).toMatch(/no such directory/);
  });

  it("prints identity, bio and experience", () => {
    expect(runCommand("whoami", index).lines).toEqual(["Dival Sehgal, Software Engineer."]);
    expect(runCommand("about", index).lines).toEqual(["Builds things."]);
    expect(runCommand("about", { ...index, about: [] }).lines).toEqual(["No bio found."]);
    expect(runCommand("experience", index).lines[0]).toMatch(/2022 – now\s+Engineer @ Acme Labs/);
  });

  it("guides cat/open when the target is missing or unknown", () => {
    expect(runCommand("cat", index).lines[0]).toMatch(/which one/);
    expect(runCommand("open nothing-here", index).lines[0]).toMatch(/not found/);
    expect(runCommand("cd", index).lines[0]).toMatch(/no such section/);
  });

  it("cats projects with and without links", () => {
    expect(runCommand("cat stack game", index).lines).toEqual(["Stack Game", "A tiny game", "  https://example.com/game"]);
    const noLink = { ...index, projects: [{ name: "Offline", description: "No link" }] };
    expect(runCommand("open offline", noLink)).toEqual({ lines: ["Offline", "No link"] });
  });

  it("handles missing skills, questions, email and resume", () => {
    expect(runCommand("skills cobol", index).lines[0]).toBe('No skills matching "cobol".');
    expect(runCommand("skills", index).lines[0]).toContain("Node.js");
    expect(runCommand("ask", index)).toEqual({ lines: ["ask: what would you like to know?"] });
    expect(runCommand("email", { ...index, email: undefined }).action).toBeUndefined();
    expect(runCommand("resume", index).action).toEqual({ type: "open", href: "https://example.com/cv.pdf" });
    expect(runCommand("resume", { ...index, resumeUrl: undefined }).lines).toEqual(["No resume link configured."]);
  });

  it("toggles theme and returns side-effect actions", () => {
    expect(runCommand("theme", index)).toEqual({ lines: ["Toggled theme."], action: { type: "theme", mode: undefined } });
    expect(runCommand("game", index).action).toEqual({ type: "game" });
    expect(runCommand("clear", index).action).toEqual({ type: "clear" });
    expect(runCommand("exit", index).action).toEqual({ type: "exit" });
    expect(runCommand("quit", index).action).toEqual({ type: "exit" });
    expect(runCommand("sudo rm -rf /", index).lines[0]).toMatch(/Nice try/);
  });

  it("leaves input unchanged when nothing completes", () => {
    expect(complete("zzz", index)).toBe("zzz");
    expect(complete("cd zzz", index)).toBe("cd zzz");
    expect(complete("open github", index)).toBe("open github");
  });
});
