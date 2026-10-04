"use client";

import { useState, useEffect, useRef } from "react";
import IconButton from "@dival-sehgal/ui/icon-button";

import { KeyboardArrowUpIcon } from "@dival-sehgal/ui/icons";
import styles from "./styles.module.scss";
import { useT } from "@/i18n/client";

/** The button appears once the page is scrolled this far. */
const SHOW_AFTER_PX = 300;
/** Roughly how long the smooth scroll to the top takes; snapping resumes after it. */
const SMOOTH_SCROLL_MS = 800;

export default function ScrollToTop() {
  const t = useT();
  const [isVisible, setIsVisible] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > SHOW_AFTER_PX) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const scrollToTop = () => {
    const html = document.documentElement;
    // Disable scroll snap for smooth jumping to top
    html.style.scrollSnapType = "none";

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    // Re-enable scroll snap after a delay (approximate time for smooth scroll)
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      html.style.scrollSnapType = "y mandatory";
      scrollTimeoutRef.current = null;
    }, SMOOTH_SCROLL_MS);
  };

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
