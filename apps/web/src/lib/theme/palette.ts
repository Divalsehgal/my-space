import * as LightTokens from "@dival-sehgal/design-tokens/light";
import * as DarkTokens from "@dival-sehgal/design-tokens/dark";

function categorical(tokens: typeof LightTokens): string[] {
  return [
    tokens.TColorsDataVizCategorical1, tokens.TColorsDataVizCategorical2, tokens.TColorsDataVizCategorical3,
    tokens.TColorsDataVizCategorical4, tokens.TColorsDataVizCategorical5, tokens.TColorsDataVizCategorical6,
    tokens.TColorsDataVizCategorical7, tokens.TColorsDataVizCategorical8, tokens.TColorsDataVizCategorical9,
    tokens.TColorsDataVizCategorical10, tokens.TColorsDataVizCategorical11, tokens.TColorsDataVizCategorical12,
  ];
}

/** Category colours per theme, from the `data-viz.categorical` design tokens. */
export const CATEGORICAL_PALETTE = {
  light: categorical(LightTokens),
  dark: categorical(DarkTokens),
} as const;
