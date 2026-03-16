import { createTheme } from "@mui/material/styles";
import { createMuiThemeFromTokens } from "./createMuiThemeFromTokens";

const theme = createTheme(createMuiThemeFromTokens());

export default theme;
