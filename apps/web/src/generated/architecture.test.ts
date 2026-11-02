import { execFileSync } from "node:child_process";
import { join } from "node:path";
import architecture from "./architecture.json";
import chatbotLld from "./chatbot-lld.json";
import { ArchitectureConfigSchema } from "@/features/portfolio";

describe("generated architecture diagram", () => {
  it("is up to date with the code (run `yarn workspace web architecture` if this fails)", () => {
    expect(() =>
      execFileSync("node", [join(__dirname, "../../scripts/generate-architecture.mjs"), "--check"], { stdio: "pipe" }),
    ).not.toThrow();
  });

  it("is a valid architecture config whose edges all point at real nodes", () => {
    const parsed = ArchitectureConfigSchema.parse(architecture);
    const ids = new Set(parsed.nodes.map((node) => node.id));
    expect(ids.has("browser")).toBe(true);
    parsed.edges.forEach((edge) => {
      expect(ids.has(edge.source)).toBe(true);
      expect(ids.has(edge.target)).toBe(true);
    });
  });

  it("chatbot LLD is valid, tiered, and its edges point at real nodes", () => {
    const parsed = ArchitectureConfigSchema.parse(chatbotLld);
    const ids = new Set(parsed.nodes.map((node) => node.id));
    ["chat-widget", "input-guard", "scope-gate", "llm-stream", "output-guard", "mcp-server", "vectorize"].forEach((id) => expect(ids.has(id)).toBe(true));
    parsed.nodes.forEach((node) => expect(node.tier).toBeDefined());
    parsed.edges.forEach((edge) => {
      expect(ids.has(edge.source)).toBe(true);
      expect(ids.has(edge.target)).toBe(true);
    });
  });
});
