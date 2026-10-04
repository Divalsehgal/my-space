"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { TerminalIcon } from "@dival-sehgal/ui/icons";
import { TBreakpointTablet } from "@dival-sehgal/design-tokens/variables.js";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useT } from "@/i18n/client";
import FluidContainer from "../FluidContainer";
import MobileMenu from "./MobileMenu";
import MobileActions from "./MobileActions";
import NavActions from "./NavActions";
import NavLinks from "./NavLinks";
import { useActiveSection } from "./hooks/useActiveSection";
import { useMenuLock } from "./hooks/useMenuLock";
import { useNavbarScroll } from "./hooks/useNavbarScroll";
import styles from "./styles.module.scss";

type NavbarProps = {
  readonly brand?: string;
};

/** Floating pill navbar: brand, desktop links and actions, and the mobile menu. */
export default function Navbar({ brand }: NavbarProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery(`(min-width: ${TBreakpointTablet})`);
  const navRef = useRef<HTMLElement>(null);
  const activeHref = useActiveSection();
  const close = useCallback(() => setOpen(false), []);

  // Render-phase correction: the mobile menu can't stay open on desktop widths.
  if (isDesktop && open) {
    setOpen(false);
  }

  useNavbarScroll(navRef, { hidden: styles["navbar--hidden"], scrolled: styles["navbar--scrolled"] });
  useMenuLock(open, close, navRef);

  return (
    <>
      {open && <div className={styles["navbar__overlay"]} onClick={close} aria-hidden="true" />}

      <nav className={clsx(styles.navbar, open && styles["navbar--open"])} ref={navRef} aria-label={t("nav.primaryLabel")}>
        <FluidContainer className={styles["navbar__shell"]}>
          <div className={styles["navbar__container"]}>
            <Link href="/" className={styles["navbar__brand"]} onClick={close}>
              <TerminalIcon className={styles["navbar__brand-icon"]} />
              <span className={styles["navbar__brand-text"]}>{brand || t("common.siteName")}</span>
            </Link>

            <div className={styles["navbar__nav-desktop"]}>
              <NavLinks activeHref={activeHref} />
              <NavActions />
            </div>

            <MobileActions open={open} onToggle={() => setOpen((prev) => !prev)} />
          </div>
        </FluidContainer>

        <MobileMenu isOpen={open} onClose={close} />
      </nav>
    </>
  );
}
