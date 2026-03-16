"use client";

import { useState, useEffect } from "react";
import { IconButton } from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import styles from "./styles.module.scss";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    // Disable scroll snap temporarily to allow smooth scrolling
    const html = document.documentElement;
    const originalScrollSnap = html.style.scrollSnapType;
    html.style.scrollSnapType = "none";

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    // Re-enable scroll snap after a delay (approximate time for smooth scroll)
    // Alternatively, listen for scroll end event if supported
    setTimeout(() => {
      html.style.scrollSnapType = originalScrollSnap;
    }, 1000);
  };

  if (!isVisible) return null;

  return (
    <div className={styles.scrollToTop}>
      <IconButton
        onClick={scrollToTop}
        className={styles.button}
        aria-label="scroll to top"
        size="large"
      >
        <KeyboardArrowUpIcon />
      </IconButton>
    </div>
  );
}
