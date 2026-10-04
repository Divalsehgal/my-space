"use client";

import IconButton from "@dival-sehgal/ui/icon-button";
import { DarkModeIcon, LightModeIcon } from "@dival-sehgal/ui/icons";
import { useThemeContext } from "@/context/ThemeContext";
import { useT } from "@/i18n/client";
import styles from "./styles.module.scss";

/** Light/dark switch: shows the mode you'd switch to. */
export default function ThemeToggle({ iconSize }: Readonly<{ iconSize?: "small" }>) {
  const t = useT();
  const { mode, toggleTheme } = useThemeContext();
  return (
    <IconButton
      onClick={toggleTheme}
      className={styles["theme-toggle"]}
      aria-label={t(mode === "light" ? "nav.themeToDark" : "nav.themeToLight")}
    >
      {mode === "light" ? <DarkModeIcon fontSize={iconSize} /> : <LightModeIcon fontSize={iconSize} />}
    </IconButton>
  );
}
