"use client";

import Link from "next/link";
import styles from "./styles.module.scss";
import { trackInteraction, ANALYTICS_EVENTS } from "@/utils/analytics";
import { navLinks } from "../constants";
import { useT } from "@/i18n/client";

type MobileMenuProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
};

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const t = useT();
  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles["mobile-menu"]}>
      {navLinks.map((l, index) => (
        <Link
          key={l.id}
          href={l.href}
          style={{ "--i": index } as React.CSSProperties}
          className={styles["mobile-menu__link"]}
          onClick={() => {
            onClose();
            trackInteraction(ANALYTICS_EVENTS.NAV_CLICK, { label: l.id, href: l.href, location: "navbar" });
          }}
        >
          {t(l.labelKey)}
        </Link>
      ))}
    </div>
  );
}
