"use client";

import Link from "next/link";
import { SearchIcon } from "@dival-sehgal/ui/icons";
import { useT } from "@/i18n/client";
import { emitSiteEvent, SITE_EVENTS } from "@/lib/site-events";
import { trackAttrs, ANALYTICS_EVENTS } from "@/utils/analytics";
import { navLinks } from "../constants";
import ThemeToggle from "../ThemeToggle";
import styles from "./styles.module.scss";

/** Desktop actions: ⌘K search, theme switch and the Contact link. */
export default function NavActions() {
  const t = useT();
  return (
    <div className={styles["nav-actions"]}>
      <button
        type="button"
        className={styles["nav-actions__search"]}
        onClick={() => emitSiteEvent(SITE_EVENTS.openPalette)}
        aria-label={t("nav.search")}
        aria-keyshortcuts="Meta+K Control+K"
      >
        <SearchIcon fontSize="inherit" />
        <kbd>⌘K</kbd>
      </button>
      <ThemeToggle iconSize="small" />
      {navLinks
        .filter((link) => link.cta)
        .map((link) => (
          <Link
            key={link.id}
            href={link.href}
            className={styles["nav-actions__cta"]}
            {...trackAttrs(ANALYTICS_EVENTS.NAV_CLICK, { label: link.id, href: link.href, location: "navbar" })}
          >
            {t(link.labelKey)}
          </Link>
        ))}
    </div>
  );
}
