// src/lib/mui/theme.ts
import { createTheme } from "@mui/material/styles";

/**
 * Helper that returns a CSS var string for your generated tokens.
 */
const cssVar = (name: string) => `var(--${name})`;

/**
 * Static fallback colors - ensures createTheme() validation passes on server.
 * (These are safe defaults; runtime visuals will come from CSS variables.)
 */
const FALLBACKS = {
    colors: {
        primary: "#0b5fff",
        primary700: "#0849d1",
        bg: "#ffffff",
        surface: "#f7f8fb",
        text: "#0b1220",
        border: "#e3e5ea",
    },
};

const theme = createTheme({
    palette: {
        mode: "light",
        // static fallback values only (prevents MUI color parsing errors)
        primary: {
            main: FALLBACKS.colors.primary,
            dark: FALLBACKS.colors.primary700,
        },
        background: {
            default: FALLBACKS.colors.bg,
            paper: FALLBACKS.colors.surface,
        },
        text: {
            primary: FALLBACKS.colors.text,
        },
        divider: FALLBACKS.colors.border,
    },

    // Typography can use CSS vars — MUI doesn't validate them here.
    typography: {
        fontFamily: cssVar("typography-fonts-body"),
        h1: {
            fontFamily: cssVar("typography-fonts-headline"),
            fontSize: cssVar("typography-sizes-h1"),
        },
        h2: {
            fontFamily: cssVar("typography-fonts-headline"),
            fontSize: cssVar("typography-sizes-h2"),
        },
        body1: {
            fontFamily: cssVar("typography-fonts-body"),
            fontSize: cssVar("typography-sizes-body"),
        },
    },

    components: {
        // Keep MUI component styleOverrides referencing CSS variables (runtime-driven)
        MuiButton: {
            styleOverrides: {
                root: {
                    //borderRadius: cssVar("radii-md"),
                    padding: `var(--spacing-sm) var(--spacing-md)`,
                    backgroundColor: cssVar("colors-primary"),
                    color: "var(--colors-text-inverse, #fff)",
                    transition: `background-color var(--transitions-base, .25s)`,
                    "&:hover": {
                        backgroundColor: cssVar("colors-primary700"),
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundColor: cssVar("colors-surface"),
                    borderRadius: cssVar("radii-md"),
                    boxShadow: cssVar("shadows-md"),
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: cssVar("colors-surface"),
                    color: cssVar("colors-text"),
                    boxShadow: "none",
                },
            },
        },
    },
});

export default theme;

/**
 * Optional helper: after hydration run this to set palette fields to CSS vars.
 * Some libraries / runtime code read theme.palette.* at runtime — calling this
 * makes those read CSS var strings instead of fallback hexes.
 */
export function applyCssVarsToTheme(t = theme) {
    if (typeof document === "undefined") return t;

    try {
        (t.palette.primary as any).main = cssVar("colors-primary");
        (t.palette.primary as any).dark = cssVar("colors-primary700");
        (t.palette.background as any).default = cssVar("colors-bg");
        (t.palette.background as any).paper = cssVar("colors-surface");
        (t.palette.text as any).primary = cssVar("colors-text");
        (t.palette as any).divider = cssVar("colors-border");
    } catch (e) {
        // non-critical
        // eslint-disable-next-line no-console
        console.warn("applyCssVarsToTheme failed:", e);
    }
    return t;
}
