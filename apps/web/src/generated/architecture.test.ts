import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { ArchitectureConfigSchema } from "@/features/portfolio";
import generated from "./architecture.json";
import chatbotLld from "./chatbot-lld.json";

const architecture = ArchitectureConfigSchema.parse(generated);
const SCRIPT = join(__dirname, "../../scripts/generate-architecture.mjs");

describe("generated architecture (scripts/generate-architecture.mjs)", () => {
  const layerIds = (architecture.layers ?? []).map((layer) => layer.id);
  const layerOf = (id: string) => layerIds.indexOf(architecture.nodes.find((node) => node.id === id)?.tier ?? "client");

  it("is committed up to date (--check)", () => {
    expect(() => execFileSync("node", [SCRIPT, "--check"], { stdio: "pipe" })).not.toThrow();
  });

  it("lays the app out as shell → pages → features → shared → services, one row each", () => {
    expect(layerIds).toEqual(["shell", "pages", "features", "shared", "services"]);
    const rowYs = layerIds.map((id) => {
      const ys = new Set(architecture.nodes.filter((node) => node.tier === id).map((node) => node.position.y));
      expect(ys.size).toBe(1);
      return [...ys][0];
    });
    expect(rowYs).toEqual([...rowYs].sort((a, b) => a - b));
  });

  it("reads the shell from app/layout.tsx and pages from page.tsx files", () => {
    const ids = architecture.nodes.map((node) => node.id);
    expect(ids).toEqual(expect.arrayContaining(["root-layout", "shell-providers", "shell-chrome", "page:/", "page:/blogs/[slug]", "containers/Home", "features/portfolio", "api-routes", "contentful"]));
    expect(ids.some((id) => id.startsWith("page:/api"))).toBe(false);
    expect(architecture.edges).toContainEqual(expect.objectContaining({ source: "page:/", target: "containers/Home" }));
  });

  it("only draws edges between real nodes, pointing down the layers (services may talk to each other)", () => {
    for (const edge of architecture.edges) {
      expect(layerOf(edge.source)).toBeGreaterThanOrEqual(0);
      expect(layerOf(edge.target)).toBeGreaterThanOrEqual(0);
      const services = layerIds.indexOf("services");
      if (layerOf(edge.source) !== services || layerOf(edge.target) !== services) {
        expect(layerOf(edge.target)).toBeGreaterThanOrEqual(layerOf(edge.source));
      }
    }
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
