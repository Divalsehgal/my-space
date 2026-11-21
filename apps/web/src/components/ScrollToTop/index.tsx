"use client";

import { useState, useEffect } from "react";
import IconButton from "@dival-sehgal/ui/icon-button";

import { KeyboardArrowUpIcon } from "@dival-sehgal/ui/icons";
import styles from "./styles.module.scss";
import { useT } from "@/i18n/client";

/** The button appears once the page is scrolled this far. */
const SHOW_AFTER_PX = 300;

export default function ScrollToTop() {
  const t = useT();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // React skips the re-render when the boolean is unchanged.
    const toggleVisibility = () => setIsVisible(window.scrollY > SHOW_AFTER_PX);

    window.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  if (!isVisible) {return null;}

  return (
    <div className={styles.scrollToTop}>
      <IconButton
        onClick={scrollToTop}
        className={styles.button}
        aria-label={t("common.scrollToTop")}
        size="large"
      >
        <KeyboardArrowUpIcon />
      </IconButton>
    </div>
  );
}
