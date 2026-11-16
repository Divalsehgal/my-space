"use client";

import { useEffect, useSyncExternalStore, useCallback } from "react";
import { ArticleIcon, CloseIcon } from "@dival-sehgal/ui/icons";
import { useT } from "@/i18n/client";
import type { TranslationKey } from "@/i18n/core";
import styles from "./styles.module.scss";

const FONT_SCALES = [
  { label: "A-", scale: 0.9, key: "decrease" },
  { label: "A", scale: 1.0, key: "reset" },
  { label: "A+", scale: 1.15, key: "increase" },
] as const;

type FontScaleKey = (typeof FONT_SCALES)[number]["key"];

const FONT_ARIA_LABEL_KEYS: Record<FontScaleKey, TranslationKey> = {
  decrease: "post.decreaseFontSize",
  reset: "post.resetFontSize",
  increase: "post.increaseFontSize",
};

type ReadingSettings = { active: boolean; scale: number };
const DEFAULT_SETTINGS: ReadingSettings = { active: false, scale: 1 };
const SETTINGS_EVENT = "blog-reading-settings-change";
let settingsOverride: ReadingSettings | null = null;

function serializeSettings(settings: ReadingSettings) {
  return `${settings.active ? "1" : "0"}|${settings.scale}`;
}

function readStoredSettings(): ReadingSettings {
  const active = localStorage.getItem("blog-reading-mode") === "true";
  const storedScale = localStorage.getItem("blog-font-scale");
  const scale = FONT_SCALES.find(({ scale: candidate }) => String(candidate) === storedScale)?.scale ?? 1;
  return { active, scale };
}

function getSettingsSnapshot() {
  if (settingsOverride) {
    return serializeSettings(settingsOverride);
  }
  try {
    return serializeSettings(readStoredSettings());
  } catch {
    return serializeSettings(DEFAULT_SETTINGS);
  }
}

function subscribeToSettings(onChange: () => void) {
  const handleStorage = () => {
    settingsOverride = null;
    onChange();
  };
  window.addEventListener(SETTINGS_EVENT, onChange);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(SETTINGS_EVENT, onChange);
    window.removeEventListener("storage", handleStorage);
  };
}

function updateSettings(settings: ReadingSettings) {
  settingsOverride = settings;
  try {
    localStorage.setItem("blog-reading-mode", String(settings.active));
    localStorage.setItem("blog-font-scale", String(settings.scale));
    settingsOverride = null;
  } catch {
    // Keep the preference for this page when storage is unavailable.
  }
  window.dispatchEvent(new Event(SETTINGS_EVENT));
}

function applyReadingMode(active: boolean, scale: number) {
  const article = document.getElementById("blog-article");
  if (!article) {
    return;
  }
  if (active) {
    article.setAttribute("data-reading-mode", "true");
    article.style.setProperty("--reading-font-scale", String(scale));
  } else {
    article.removeAttribute("data-reading-mode");
    article.style.removeProperty("--reading-font-scale");
  }
}

export default function ReadingModeControls() {
  const t = useT();
  const [activeSnapshot, scaleSnapshot] = useSyncExternalStore(
    subscribeToSettings,
    getSettingsSnapshot,
    () => serializeSettings(DEFAULT_SETTINGS),
  ).split("|");
  const isReadingMode = activeSnapshot === "1";
  const fontScale = Number(scaleSnapshot);

  const toggleReadingMode = useCallback(() => {
    const next = !isReadingMode;
    updateSettings({ active: next, scale: fontScale });
    applyReadingMode(next, fontScale);
  }, [fontScale, isReadingMode]);

  const changeScale = useCallback(
    (newScale: number) => {
      updateSettings({ active: isReadingMode, scale: newScale });
      applyReadingMode(isReadingMode, newScale);
    },
    [isReadingMode]
  );

  useEffect(() => {
    applyReadingMode(isReadingMode, fontScale);
  }, [fontScale, isReadingMode]);

  useEffect(() => () => applyReadingMode(false, 1), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isReadingMode && !e.defaultPrevented) {
        updateSettings({ active: false, scale: fontScale });
        applyReadingMode(false, 1.0);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [fontScale, isReadingMode]);

  if (!isReadingMode) {
    return (
      <div className={styles.readingToggle}>
        <button
          type="button"
          onClick={toggleReadingMode}
          className={styles.toggleBtn}
          aria-label={t("post.readingMode")}
          title={t("post.readingMode")}
        >
          <ArticleIcon fontSize="inherit" className={styles.btnIcon} />
          <span>{t("post.readingMode")}</span>
        </button>
      </div>
    );
  }

  return (
    <div className={styles.toolbar} role="region" aria-label={t("post.readingMode")}>
      <div className={styles.toolbarBadge}>
        <ArticleIcon fontSize="inherit" />
        <span>{t("post.readingMode")}</span>
      </div>

      <div className={styles.toolbarControls}>
        <div className={styles.fontGroup} role="group" aria-label="Font size">
          {FONT_SCALES.map(({ label, scale, key }) => (
            <button
              key={key}
              type="button"
              onClick={() => changeScale(scale)}
              data-active={fontScale === scale ? "true" : undefined}
              className={styles.fontBtn}
              aria-label={t(FONT_ARIA_LABEL_KEYS[key])}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={toggleReadingMode}
          className={styles.exitBtn}
          aria-label={t("post.exitReadingMode")}
        >
          <CloseIcon fontSize="inherit" className={styles.exitIcon} />
          <span>{t("post.exitReadingMode")}</span>
        </button>
      </div>
    </div>
  );
}
