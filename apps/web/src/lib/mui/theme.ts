import { createTheme } from "@mui/material/styles";
import { createMuiThemeFromTokens } from "./createMuiThemeFromTokens";

/**
 * @deprecated Use ThemeContext for dynamic theme switching instead.
 * This static theme is maintained for backward compatibility and defaults to 'light'.
 */
const theme = createTheme(createMuiThemeFromTokens('light'));

export default theme;

