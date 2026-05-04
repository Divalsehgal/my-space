import { createMuiThemeFromTokens } from "./createMuiThemeFromTokens";

jest.mock("@dival-sehgal/design-tokens/variables.js", () => ({
  TColorsPrimaryDefault: "#ff0000",
  TColorsTextPrimary: "#ffffff",
  TFontFamilyHeading: "Inter, sans-serif",
  TFontSizeXxl: "2rem",
  TDimensions1: "8px",
}));

describe("createMuiThemeFromTokens", () => {
  it("generates a ThemeOptions object with mapped tokens", () => {
    const theme = createMuiThemeFromTokens();

    expect(theme.palette?.mode).toBe("dark");
    expect(theme.palette?.primary?.main).toBe("#ff0000");
    expect(theme.palette?.text?.primary).toBe("#ffffff");
    
    expect(theme.typography?.h1?.fontFamily).toBe("Inter, sans-serif");
    expect(theme.typography?.h1?.fontSize).toBe("2rem");
    
    expect(theme.shape?.borderRadius).toBe(8);
  });

  it("falls back to default borderRadius if token is invalid", async () => {
    jest.resetModules();
    jest.doMock("@dival-sehgal/design-tokens/variables.js", () => ({
      TDimensions1: "invalid",
    }));

    const { createMuiThemeFromTokens } = await import("./createMuiThemeFromTokens");
    const theme = createMuiThemeFromTokens();
    
    expect(theme.shape?.borderRadius).toBe(4);
  });
});
