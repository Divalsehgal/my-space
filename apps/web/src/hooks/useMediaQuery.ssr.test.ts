
describe("useMediaQuery SSR branch", () => {
  const originalWindow = global.window;

  afterEach(() => {
    global.window = originalWindow;
  });

  it("evaluates the top-level useEnhancedEffect branch when window is undefined", async () => {
    // @ts-expect-error - window is not optional in global, but we want to delete it for SSR testing
    delete global.window;
    
    await jest.isolateModulesAsync(async () => {
      // Re-importing the module when window is undefined triggers the branch evaluation
      const { useMediaQuery } = await import("./useMediaQuery");
      expect(useMediaQuery).toBeDefined();
    });
  });
});
