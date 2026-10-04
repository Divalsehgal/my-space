"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useSiteIndex } from "@/components/SiteIndex";
import { useThemeContext } from "@/context/ThemeContext";
import { lockScroll, unlockScroll } from "@/lib/scroll";
import { emitSiteEvent, SITE_EVENTS } from "@/lib/site-events";
import { isEditableTarget } from "@dival-sehgal/utils/dom";
import type { PaletteItem } from "@/components/CommandPalette/items";

/** Without requestIdleCallback (Safari), preload the overlays after this delay instead. */
const PRELOAD_FALLBACK_DELAY_MS = 2500;

// Both overlays load on first use only.
const CommandPalette = dynamic(() => import("@/components/CommandPalette"), { ssr: false });
const Terminal = dynamic(() => import("@/components/Terminal"), { ssr: false });

type Mode = "closed" | "palette" | "terminal";


/** Global ⌘K / Ctrl+K palette and ` terminal. */
export default function CommandCenter() {
  const index = useSiteIndex();
  const router = useRouter();
  const { toggleTheme } = useThemeContext();
  const [mode, setMode] = useState<Mode>("closed");
  const close = useCallback(() => setMode("closed"), []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setMode((current) => (current === "palette" ? "closed" : "palette"));
      } else if (event.key === "`" && !isEditableTarget(event.target)) {
        event.preventDefault();
        setMode((current) => (current === "terminal" ? "closed" : "terminal"));
      } else if (event.key === "Escape") {
        setMode("closed");
      }
    };
    const openPalette = () => setMode("palette");
    const openTerminal = () => setMode("terminal");
    window.addEventListener("keydown", onKey);
    window.addEventListener(SITE_EVENTS.openPalette, openPalette);
    window.addEventListener(SITE_EVENTS.openTerminal, openTerminal);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(SITE_EVENTS.openPalette, openPalette);
      window.removeEventListener(SITE_EVENTS.openTerminal, openTerminal);
    };
  }, []);

  // Fetch both overlays once the page is idle, so the first ⌘K or ` opens
  // instantly and no keystrokes are lost while a chunk loads.
  useEffect(() => {
    const preload = () => {
      void import("@/components/CommandPalette");
      void import("@/components/Terminal");
    };
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(preload, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(preload, PRELOAD_FALLBACK_DELAY_MS); // Safari has no requestIdleCallback
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (mode === "closed") {return;}
    lockScroll();
    return () => unlockScroll();
  }, [mode]);

  const run = (item: PaletteItem) => {
    const { action } = item;
    setMode(action.type === "terminal" ? "terminal" : "closed");
    switch (action.type) {
      case "navigate":
        router.push(action.href);
        break;
      case "open":
        window.open(action.href, "_blank", "noopener,noreferrer");
        break;
      case "theme":
        toggleTheme();
        break;
      case "copy":
        navigator.clipboard?.writeText(action.text).catch(() => undefined);
        break;
      case "game":
        emitSiteEvent(SITE_EVENTS.openGame);
        break;
      case "chat":
        emitSiteEvent(SITE_EVENTS.openChat);
        break;
      case "terminal":
        break;
    }
  };

  if (!index || mode === "closed") {return null;}
  return mode === "palette" ? (
    <CommandPalette index={index} onRun={run} onClose={close} />
  ) : (
    <Terminal index={index} onClose={close} />
  );
}
