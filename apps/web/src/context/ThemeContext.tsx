"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { createMuiThemeFromTokens } from "@/lib/mui/createMuiThemeFromTokens";

type ThemeMode = "light" | "dark";

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeContextProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Must start as "light" to match both the server-rendered HTML and the
  // hardcoded data-theme="light" on <html> in layout.tsx. The real saved
  // theme is read a moment later in the effect below — reading it here via a
  // lazy initializer would make the client's hydration-pass render disagree
  // with the server, since the beforeInteractive bootstrap script in
  // layout.tsx has already set the real data-theme on <html> by the time
  // React hydrates, causing a hydration mismatch (and MUI's IconButton icon/
  // aria-label were the visible symptom of it).
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    // The bootstrap script already computed and applied the real theme
    // (localStorage, else prefers-color-scheme) before hydration — just sync
    // React state to what's already on the DOM. This intentionally triggers
    // one extra render right after mount; that's the fix for the hydration
    // mismatch above, not a bug the lint rule should flag.
    if (document.documentElement.dataset.theme === "dark") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode("dark");
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  const toggleTheme = useCallback(() => {
    const newMode = mode === "light" ? "dark" : "light";
    setMode(newMode);
    try {
      localStorage.setItem("theme-mode", newMode);
    } catch {
      // Theme still updates for this session when storage is unavailable.
    }
  }, [mode]);

  const theme = useMemo(
    () => createTheme(createMuiThemeFromTokens(mode)),
    [mode],
  );

  const contextValue = useMemo(
    () => ({ mode, toggleTheme }),
    [mode, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error(
      "useThemeContext must be used within a ThemeContextProvider",
    );
  }
  return context;
}
