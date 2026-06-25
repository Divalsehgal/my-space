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

function getInitialThemeMode(): ThemeMode {
  if (globalThis.window === undefined) {
    return "light";
  }

  const currentTheme = document.documentElement.dataset.theme;
  if (currentTheme === "light" || currentTheme === "dark") {
    return currentTheme;
  }

  try {
    const savedMode = localStorage.getItem("theme-mode");
    if (savedMode === "light" || savedMode === "dark") {
      return savedMode;
    }
  } catch {
    return "light";
  }

  return globalThis.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeContextProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    const timer = globalThis.setTimeout(() => {
      const initialMode = getInitialThemeMode();
      setMode((currentMode) =>
        currentMode === initialMode ? currentMode : initialMode,
      );
    }, 0);

    return () => {
      globalThis.clearTimeout(timer);
    };
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
