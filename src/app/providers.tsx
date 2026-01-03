"use client";
import React, { useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme, { applyCssVarsToTheme } from "@/lib/mui/theme";

export default function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  useEffect(() => {
    // optional: sync theme.palette.* to CSS vars for runtime consumers
    applyCssVarsToTheme(theme);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
