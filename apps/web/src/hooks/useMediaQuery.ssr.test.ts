
describe("useMediaQuery SSR branch", () => {
  const originalWindow = global.window;

  afterEach(() => {
    global.window = originalWindow;
  });

  it("evaluates the top-level useEnhancedEffect branch when window is undefined", () => {
    // @ts-ignore
    delete global.window;
    
    jest.isolateModules(() => {
      // Re-importing the module when window is undefined triggers the branch evaluation
      const { useMediaQuery } = require("./useMediaQuery");
      expect(useMediaQuery).toBeDefined();
    });
  });
});
