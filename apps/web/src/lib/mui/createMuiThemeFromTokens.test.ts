/* eslint-disable @typescript-eslint/no-explicit-any */

import { createMuiThemeFromTokens } from "./createMuiThemeFromTokens";

jest.mock("@dival-sehgal/design-tokens/dark", () => ({
  TColorsPrimaryDefault: "#ff0000",
  TColorsPrimaryLight: "#ff3333",
  TColorsPrimaryDark: "#cc0000",
  TColorsButtonPrimaryText: "#ffffff",
  TColorsSecondaryDefault: "#ff8c42",
  TColorsSecondaryLight: "#ffaa66",
  TColorsSecondaryDark: "#ff7020",
  TColorsButtonSecondaryText: "#000000",
  TColorsBackgroundPrimary: "#1a1a1a",
  TColorsBackgroundSecondary: "#2d2d2d",
  TColorsTextPrimary: "#ffffff",
  TColorsTextSecondary: "#cccccc",
  TColorsTextDisabled: "#999999",
  TColorsBorderDefault: "#444444",
  TFontFamilyBody: "system-ui, sans-serif",
  TFontFamilyHeading: "Inter, sans-serif",
  TFontSizeXxl: "2rem",
  TFontSizeXl: "1.75rem",
  TFontSizeLg: "1.5rem",
  TFontSizeSm: "1rem",
  TFontSizeXs: "0.875rem",
  TFontWeightBold: "700",
  TFontWeightMedium: "600",
  TFontWeightRegular: "400",
  TFontLineHeightTight: "1.2",
  TFontLineHeightNormal: "1.5",
  TDimensions1: "8px",
  TColorsButtonPrimaryBackground: "#ff0000",
  TColorsButtonPrimaryBorder: "#ff0000",
  TColorsButtonPrimaryBackgroundHover: "#cc0000",
}));

jest.mock("@dival-sehgal/design-tokens/light", () => ({
  TColorsPrimaryDefault: "#ff0000",
  TColorsPrimaryLight: "#ff3333",
  TColorsPrimaryDark: "#cc0000",
  TColorsButtonPrimaryText: "#ffffff",
  TColorsSecondaryDefault: "#ff8c42",
  TColorsSecondaryLight: "#ffaa66",
  TColorsSecondaryDark: "#ff7020",
  TColorsButtonSecondaryText: "#000000",
  TColorsBackgroundPrimary: "#ffffff",
  TColorsBackgroundSecondary: "#f5f5f5",
  TColorsTextPrimary: "#000000",
  TColorsTextSecondary: "#666666",
  TColorsTextDisabled: "#999999",
  TColorsBorderDefault: "#cccccc",
  TFontFamilyBody: "system-ui, sans-serif",
  TFontFamilyHeading: "Inter, sans-serif",
  TFontSizeXxl: "2rem",
  TFontSizeXl: "1.75rem",
  TFontSizeLg: "1.5rem",
  TFontSizeSm: "1rem",
  TFontSizeXs: "0.875rem",
  TFontWeightBold: "700",
  TFontWeightMedium: "600",
  TFontWeightRegular: "400",
  TFontLineHeightTight: "1.2",
  TFontLineHeightNormal: "1.5",
  TDimensions1: "8px",
  TColorsButtonPrimaryBackground: "#ff0000",
  TColorsButtonPrimaryBorder: "#ff0000",
  TColorsButtonPrimaryBackgroundHover: "#cc0000",
}));

describe("createMuiThemeFromTokens", () => {
  it("generates a ThemeOptions object with mapped tokens", () => {
    const theme = createMuiThemeFromTokens("dark");

    expect(theme.palette?.mode).toBe("dark");
    expect((theme.palette?.primary as any)?.main).toBe("#ff0000");
    expect((theme.palette?.text as any)?.primary).toBe("#ffffff");

    expect((theme.typography as any)?.h1?.fontFamily).toBe("Inter, sans-serif");
    expect((theme.typography as any)?.h1?.fontSize).toBe("2rem");

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
