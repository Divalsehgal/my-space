"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { motion } from "framer-motion";
import { useT } from "@/i18n/client";
import { trackAttrs, ANALYTICS_EVENTS } from "@/utils/analytics";
import { navLinks } from "../constants";
import styles from "./styles.module.scss";

/** Spring for the highlight sliding between links. */
const HIGHLIGHT_SPRING = { type: "spring", stiffness: 380, damping: 32 } as const;

/** Desktop links; a highlight slides to the hovered link, else the current section. */
export default function NavLinks({ activeHref }: Readonly<{ activeHref: string | null }>) {
  const t = useT();
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const highlightHref = hoveredHref ?? activeHref;

  return (
    <ul className={styles["nav-links"]} onMouseLeave={() => setHoveredHref(null)}>
      {navLinks
        .filter((link) => !link.cta)
        .map((link) => (
          <li key={link.id} className={styles["nav-links__item"]} onMouseEnter={() => setHoveredHref(link.href)}>
            {highlightHref === link.href && (
              <motion.span layoutId="navbar-highlight" className={styles["nav-links__highlight"]} transition={HIGHLIGHT_SPRING} />
            )}
            <Link
              href={link.href}
              className={clsx(styles["nav-links__link"], activeHref === link.href && styles["nav-links__link--active"])}
              aria-current={activeHref === link.href ? "location" : undefined}
              {...trackAttrs(ANALYTICS_EVENTS.NAV_CLICK, { label: link.id, href: link.href, location: "navbar" })}
            >
              {t(link.labelKey)}
            </Link>
          </li>
        ))}
    </ul>
  );
}
