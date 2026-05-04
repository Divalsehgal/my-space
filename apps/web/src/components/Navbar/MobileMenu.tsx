"use client";

import Link from "next/link";
import clsx from "clsx";
import styles from "./styles.module.scss";
import { trackInteraction, ANALYTICS_EVENTS } from "@/utils/analytics";
import { navLinks } from "./constants";

type MobileMenuProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
};

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles["navbar__mobile-menu"]}>
      {navLinks.map((l) => (
        <Link
          key={l.label}
          href={l.href}
          className={clsx(styles["navbar__nav-link"], styles["navbar__nav-link--mobile"])}
          onClick={() => {
            onClose();
            trackInteraction(ANALYTICS_EVENTS.NAV_CLICK, { label: l.label, href: l.href, location: "navbar" });
          }}
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}
