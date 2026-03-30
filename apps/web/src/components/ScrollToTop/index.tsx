"use client";

import { useState, useEffect, useRef } from "react";
import { IconButton } from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import styles from "./styles.module.scss";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
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
    }, 800);
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
