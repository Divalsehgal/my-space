import { ThemeOptions } from '@mui/material/styles';
import * as LightTokens from '@dival-sehgal/design-tokens/light';
import * as DarkTokens from '@dival-sehgal/design-tokens/dark';

/**
 * Maps design tokens to MUI ThemeOptions.
 * This ensures that the MUI theme is always in sync with the design tokens.
 */
export function createMuiThemeFromTokens(mode: 'light' | 'dark' = 'light'): ThemeOptions {
    const Tokens = mode === 'light' ? LightTokens : DarkTokens;

    return {
        palette: {
            mode,
            primary: {
                main: Tokens.TColorsPrimaryDefault,
                light: Tokens.TColorsPrimaryLight,
                dark: Tokens.TColorsPrimaryDark,
                contrastText: Tokens.TColorsButtonPrimaryText,
            },
            secondary: {
                main: Tokens.TColorsSecondaryDefault,
                light: Tokens.TColorsSecondaryLight,
                dark: Tokens.TColorsSecondaryDark,
                contrastText: Tokens.TColorsButtonSecondaryText,
            },
            background: {
                default: Tokens.TColorsBackgroundPrimary,
                paper: Tokens.TColorsBackgroundSecondary,
            },
            text: {
                primary: Tokens.TColorsTextPrimary,
                secondary: Tokens.TColorsTextSecondary,
                disabled: Tokens.TColorsTextDisabled,
            },
            divider: Tokens.TColorsBorderDefault,
        },
        typography: {
            fontFamily: Tokens.TFontFamilyBody,
            h1: {
                fontFamily: Tokens.TFontFamilyHeading,
                fontSize: Tokens.TFontSizeXxl,
                fontWeight: parseInt(Tokens.TFontWeightBold, 10),
                lineHeight: Tokens.TFontLineHeightTight,
            },
            h2: {
                fontFamily: Tokens.TFontFamilyHeading,
                fontSize: Tokens.TFontSizeXl,
                fontWeight: parseInt(Tokens.TFontWeightMedium, 10),
                lineHeight: Tokens.TFontLineHeightTight,
            },
            h3: {
                fontFamily: Tokens.TFontFamilyHeading,
                fontSize: Tokens.TFontSizeLg,
                fontWeight: parseInt(Tokens.TFontWeightMedium, 10),
            },
            body1: {
                fontFamily: Tokens.TFontFamilyBody,
                fontSize: Tokens.TFontSizeSm, // Base size is 16px usually
                fontWeight: parseInt(Tokens.TFontWeightRegular, 10),
                lineHeight: Tokens.TFontLineHeightNormal,
            },
            body2: {
                fontFamily: Tokens.TFontFamilyBody,
                fontSize: Tokens.TFontSizeXs,
                fontWeight: parseInt(Tokens.TFontWeightRegular, 10),
                lineHeight: Tokens.TFontLineHeightNormal,
            },
            button: {
                fontFamily: Tokens.TFontFamilyBody,
                fontWeight: parseInt(Tokens.TFontWeightMedium, 10),
                textTransform: 'none',
            },
        },
        shape: {
            borderRadius: parseInt(Tokens.TDimensions1, 10) || 4,
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        backgroundColor: 'var(--t-colors-surface-brand-subtle)',
                        color: 'var(--t-colors-text-secondary)',
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: Tokens.TDimensions1,
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
                    containedSecondary: {
                        backgroundColor: Tokens.TColorsButtonSecondaryBackground,
                        color: Tokens.TColorsButtonSecondaryText,
                        border: `1px solid ${Tokens.TColorsButtonSecondaryBorder}`,
                        '&:hover': {
                            backgroundColor: Tokens.TColorsButtonSecondaryBackgroundHover,
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
                            borderColor: Tokens.TColorsInputBorder,
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: Tokens.TColorsInputBorderFocus,
                        }
                    },
                    input: {
                        '&::placeholder': {
                            color: Tokens.TColorsInputPlaceholder,
                            opacity: 1,
                        }
                    }
                }
            },
        },
    };
}
