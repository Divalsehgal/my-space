import { contentfulImageLoader } from "./imageLoader";

describe("contentfulImageLoader", () => {
  it("makes protocol-relative URLs https and adds params", () => {
    expect(contentfulImageLoader({ src: "//images.ctfassets.net/a.png", width: 640, quality: 50 })).toBe(
      "https://images.ctfassets.net/a.png?w=640&q=50&fm=webp",
    );
  });

  it("keeps absolute URLs and defaults quality", () => {
    expect(contentfulImageLoader({ src: "https://x.test/a.png", width: 100 })).toBe("https://x.test/a.png?w=100&q=75&fm=webp");
  });
});
