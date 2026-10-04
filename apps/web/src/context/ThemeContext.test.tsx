import { act, render, renderHook, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import { ThemeContextProvider, useThemeContext } from "./ThemeContext";

const wrapper = ({ children }: { children: ReactNode }) => <ThemeContextProvider>{children}</ThemeContextProvider>;

function Probe() {
  const { mode, toggleTheme } = useThemeContext();
  return <button onClick={toggleTheme}>{mode}</button>;
}

describe("ThemeContext", () => {
  beforeEach(() => {
    delete document.documentElement.dataset.theme;
    localStorage.clear();
  });

  it("starts light and applies the theme to <html>", () => {
    render(<Probe />, { wrapper });
    expect(screen.getByRole("button")).toHaveTextContent("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(document.documentElement.style.colorScheme).toBe("light");
  });

  it("syncs to a dark theme set before hydration", () => {
    document.documentElement.dataset.theme = "dark";
    const { result } = renderHook(() => useThemeContext(), { wrapper });
    expect(result.current.mode).toBe("dark");
  });

  it("toggles and persists the theme", () => {
    const { result } = renderHook(() => useThemeContext(), { wrapper });
    act(() => result.current.toggleTheme());
    expect(result.current.mode).toBe("dark");
    expect(localStorage.getItem("theme-mode")).toBe("dark");
    act(() => result.current.toggleTheme());
    expect(result.current.mode).toBe("light");
  });

  it("still toggles when storage throws", () => {
    const setItem = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const { result } = renderHook(() => useThemeContext(), { wrapper });
    act(() => result.current.toggleTheme());
    expect(result.current.mode).toBe("dark");
    setItem.mockRestore();
  });

  it("throws outside the provider", () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => renderHook(() => useThemeContext())).toThrow("useThemeContext must be used within a ThemeContextProvider");
    error.mockRestore();
  });
});
