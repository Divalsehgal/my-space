import { getArchitecture, CHATBOT_LLD } from "./data";
import { portfolioService } from "@/features/portfolio";

jest.mock("@/features/portfolio", () => ({ ...jest.requireActual("@/features/portfolio"), portfolioService: { getConfig: jest.fn() } }));

const remote = { nodes: [{ id: "n", position: { x: 0, y: 0 }, data: { label: "N" } }], edges: [] };

describe("architecture data", () => {
  it("prefers the remote config when it has nodes", async () => {
    (portfolioService.getConfig as jest.Mock).mockResolvedValue({ config: { architecture: remote } });
    expect(await getArchitecture()).toBe(remote);
  });

  it("falls back to the generated diagram", async () => {
    (portfolioService.getConfig as jest.Mock).mockResolvedValue({ config: { architecture: { nodes: [], edges: [] } } });
    expect((await getArchitecture()).nodes.length).toBeGreaterThan(0);
    expect(CHATBOT_LLD.nodes.length).toBeGreaterThan(0);
  });
});
