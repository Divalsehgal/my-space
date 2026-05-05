import { ThemeOptions } from '@mui/material/styles';
import * as Tokens from '@dival-sehgal/design-tokens/variables.js';

/**
 * Maps design tokens to MUI ThemeOptions.
 * This ensures that the MUI theme is always in sync with the design tokens.
 */
export function createMuiThemeFromTokens(): ThemeOptions {
    return {
        palette: {
            mode: 'dark', // The current token set is designed for a dark theme (BackgroundPrimary is dark)
            primary: {
                main: Tokens.TColorsPrimaryDefault,
                light: Tokens.TColorsPrimaryLight,
                dark: Tokens.TColorsPrimaryDark,
                contrastText: Tokens.TColorsTextPrimary, // Assuming light text on primary orange
            },
            background: {
                default: Tokens.TColorsBackgroundPrimary,
                paper: Tokens.TColorsInputBackground, // Using input background as a surface proxy if needed, or default
            },
            text: {
                primary: Tokens.TColorsTextPrimary,
                secondary: Tokens.TColorsTextSecondary,
                disabled: Tokens.TColorsTextDisabled,
            },
            divider: Tokens.TColorsBorderDefault,
            // Add other semantic colors if available
        },
        typography: {
            fontFamily: Tokens.TFontFamilyBody,
            h1: {
                fontFamily: Tokens.TFontFamilyHeading,
                fontSize: Tokens.TFontSizeXxl,
                fontWeight: Tokens.TFontWeightBold as unknown as number, // Cast to number for MUI
                lineHeight: Tokens.TFontLineHeightTight,
            },
            h2: {
                fontFamily: Tokens.TFontFamilyHeading,
                fontSize: Tokens.TFontSizeXl,
                fontWeight: Tokens.TFontWeightMedium as unknown as number,
                lineHeight: Tokens.TFontLineHeightTight,
            },
            h3: {
                fontFamily: Tokens.TFontFamilyHeading,
                fontSize: Tokens.TFontSizeLg,
                fontWeight: Tokens.TFontWeightMedium as unknown as number,
            },
            body1: {
                fontFamily: Tokens.TFontFamilyBody,
                fontSize: Tokens.TFontSizeMd,
                fontWeight: Tokens.TFontWeightRegular as unknown as number,
                lineHeight: Tokens.TFontLineHeightNormal,
            },
            body2: {
                fontFamily: Tokens.TFontFamilyBody,
                fontSize: Tokens.TFontSizeSm,
                fontWeight: Tokens.TFontWeightRegular as unknown as number,
                lineHeight: Tokens.TFontLineHeightNormal,
            },
            button: {
                fontFamily: Tokens.TFontFamilyBody,
                fontWeight: Tokens.TFontWeightMedium as unknown as number,
                textTransform: 'none', // Modern convention
            },
        },
        shape: {
            borderRadius: parseInt(Tokens.TDimensions1, 10) || 4, // Default to a token value if possible
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: Tokens.TDimensions1, // 4px based on checks, or choose a button radius token if exists
                        textTransform: 'none',
                        fontWeight: Tokens.TFontWeightMedium,
                    },
                    containedPrimary: {
                        backgroundColor: Tokens.TColorsButtonPrimaryBackground,
                        color: Tokens.TColorsButtonPrimaryText,
                        border: `1px solid ${Tokens.TColorsButtonPrimaryBorder}`,
                        '&:hover': {
                            backgroundColor: Tokens.TColorsButtonPrimaryBackgroundHover,
                        },
                        '&:active': {
                            backgroundColor: Tokens.TColorsButtonPrimaryBackgroundActive,
                        },
                        '&.Mui-disabled': {
                            backgroundColor: Tokens.TColorsButtonPrimaryBackgroundDisabled,
                            color: Tokens.TColorsTextDisabled,
                        }
                    },
                    outlinedSecondary: {
                        backgroundColor: Tokens.TColorsButtonSecondaryBackground,
                        color: Tokens.TColorsButtonSecondaryText,
                        borderColor: Tokens.TColorsButtonSecondaryBorder,
                        '&:hover': {
                            backgroundColor: Tokens.TColorsButtonSecondaryBackgroundHover,
                            borderColor: Tokens.TColorsButtonSecondaryBorderHover,
                        },
                        '&:active': {
                            backgroundColor: Tokens.TColorsButtonSecondaryBackgroundActive,
                        }
                    }
                },
            },
            MuiOutlinedInput: {
                styleOverrides: {
                    root: {
                        backgroundColor: Tokens.TColorsInputBackground,
                        color: Tokens.TColorsInputText,
                        '&:hover': {
                            backgroundColor: Tokens.TColorsInputBackgroundHover,
                        },
                        '&.Mui-focused': {
                            backgroundColor: Tokens.TColorsInputBackgroundFocus,
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: Tokens.TColorsInputBorder,
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: Tokens.TColorsInputBorder, // Or a hover border token
                        },
                    },
                    input: {
                        '&::placeholder': {
                            color: Tokens.TColorsInputPlaceholder,
                            opacity: 1,
                        }
                    }
                }
            },
            MuiTypography: {
                defaultProps: {
                    variantMapping: {
                        h1: 'h1',
                        h2: 'h2',
                        h3: 'h3',
                        body1: 'p',
                        body2: 'p',
                    },
                },
            },
        },
    };
}
