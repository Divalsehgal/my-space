"use client";

import IconButton from "@dival-sehgal/ui/icon-button";
import { CloseIcon, MenuIcon, SearchIcon } from "@dival-sehgal/ui/icons";
import { useT } from "@/i18n/client";
import { emitSiteEvent, SITE_EVENTS } from "@/lib/site-events";
import ThemeToggle from "../ThemeToggle";
import styles from "./styles.module.scss";

type MobileActionsProps = {
  readonly open: boolean;
  readonly onToggle: () => void;
};

/** Phone/tablet actions: search, theme switch and the menu button. */
export default function MobileActions({ open, onToggle }: MobileActionsProps) {
  const t = useT();
  return (
    <div className={styles["mobile-actions"]}>
      <IconButton
        onClick={() => emitSiteEvent(SITE_EVENTS.openPalette)}
        className={styles["mobile-actions__search"]}
        aria-label={t("nav.search")}
      >
        <SearchIcon fontSize="small" />
      </IconButton>
      <ThemeToggle />
      <IconButton className={styles["mobile-actions__menu"]} onClick={onToggle} aria-label={t(open ? "nav.closeMenu" : "nav.openMenu")}>
        {open ? <CloseIcon /> : <MenuIcon />}
      </IconButton>
    </div>
  );
}
