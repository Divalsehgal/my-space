import { portfolioService } from "./portfolio.service";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

// Mock fetchWithRetry
jest.mock("@/utils/fetchWithRetry", () => ({
  fetchWithRetry: jest.fn(),
}));

describe("PortfolioService", () => {
  const mockConfig = {
    hero: { title: "Hero Title", subtitle: "Subtitle", description: "Desc" },
    about: { title: "About", paragraphs: ["P1"], facts: [] },
  };

  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => { /* No-op */ });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("fetches and parses config successfully", async () => {
    (fetchWithRetry as jest.Mock).mockImplementation(async (_operation) => {
      // Simulate fetch success
      return {
        ok: true,
        json: async () => mockConfig,
      };
    });

    const result = await portfolioService.getConfig();

    expect(fetchWithRetry).toHaveBeenCalledTimes(1);
    expect(result.config.hero?.title).toBe("Hero Title");
  });

  it("throws an error if fetch response is not ok", async () => {
    (fetchWithRetry as jest.Mock).mockImplementation(async () => {
      return {
        ok: false,
        statusText: "Not Found",
      };
    });

    await expect(portfolioService.getConfig()).rejects.toThrow("Failed to fetch portfolio config: Not Found");
  });

  it("throws a validation error if JSON fails schema parse", async () => {
    (fetchWithRetry as jest.Mock).mockImplementation(async () => {
      return {
        ok: true,
        json: async () => ({
          hero: 123, // Invalid type for hero (should be object)
        }),
      };
    });

    await expect(portfolioService.getConfig()).rejects.toThrow();
  });

  it("returns a singleton instance from getInstance", async () => {
    // Import dynamically to get the class itself
    const { PortfolioService } = await import("./portfolio.service");
    const instance1 = PortfolioService.getInstance();
    const instance2 = PortfolioService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it("actually executes the underlying fetch call inside fetchWithRetry", async () => {
    // We need to test the inner callback function `(sig) => fetch(...)` at line 21
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockConfig,
    });

    (fetchWithRetry as jest.Mock).mockImplementation(async (operation) => {
      // Execute the callback that is passed into fetchWithRetry
      return operation(new AbortController().signal);
    });

    await portfolioService.getConfig();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("config.json?t="),
      expect.objectContaining({ next: { revalidate: 60, tags: ["portfolio"] } })
    );

    global.fetch = originalFetch;
  });
});
