import { buildLlmsTxt, buildLlmsFullTxt } from "./llms";
import { siteIndexFixture } from "@/test-utils/siteIndex";
import { SITE_URL } from "@/lib/config/site";

const posts = [{ title: "Hello World", slug: "hello-world", description: "First post", date: "2026-01-02T10:00:00Z", content: "Full body text." }];

describe("buildLlmsTxt", () => {
  const txt = buildLlmsTxt(siteIndexFixture, posts);

  it("starts with the name and a one-line summary", () => {
    expect(txt.startsWith("# Dival Sehgal\n\n> Builds things.\n")).toBe(true);
  });

  it("lists profile, experience, projects, posts and pages with absolute links", () => {
    expect(txt).toContain("- Skills: React, TypeScript, Node.js");
    expect(txt).toContain("- Engineer, Acme Labs (2022 – now)");
    expect(txt).toContain("- [Stack Game](https://example.com/game): A tiny game");
    expect(txt).toContain("- Offline: No link");
    expect(txt).toContain(`- [Hello World](${SITE_URL}/blogs/hello-world): 2026-01-02 - First post`);
    expect(txt).toContain(`- [About](${SITE_URL}/#about)`);
    expect(txt).toContain(`${SITE_URL}/llms-full.txt`);
  });

  it("leaves post bodies out", () => {
    expect(txt).not.toContain("Full body text.");
  });
});

describe("buildLlmsFullTxt", () => {
  it("appends each post's full text", () => {
    const txt = buildLlmsFullTxt(siteIndexFixture, posts);
    expect(txt).toContain(`## Hello World\n\nURL: ${SITE_URL}/blogs/hello-world\nPublished: 2026-01-02\n\nFull body text.`);
  });
});
