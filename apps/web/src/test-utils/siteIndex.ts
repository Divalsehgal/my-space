import type { SiteIndex } from "@/lib/site-index";

/** A small, complete site index for terminal / palette tests. */
export const siteIndexFixture: SiteIndex = {
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
  projects: [
    { name: "Stack Game", description: "A tiny game", href: "https://example.com/game" },
    { name: "Offline", description: "No link" },
  ],
  posts: [{ title: "Hello World", slug: "hello-world" }],
};
