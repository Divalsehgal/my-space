"use client";

import Link from "next/link";
import { IconButton, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import TerminalIcon from "@mui/icons-material/Terminal";
import { useState, useEffect, useRef } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import styles from "./styles.module.scss";
import FluidContainer from "../FluidContainer";
import { TBreakpointTablet } from "@dival-sehgal/design-tokens/variables.js";
const navLinks = [
  { label: "Home", href: "/#home" },
  { label: "About", href: "/#about" },
  { label: "Blogs", href: "/blogs" },
  { label: "Projects", href: "/#projects" },
  { label: "Experience", href: "/#experience" },
  { label: "Contact", href: "/#contact", cta: true },
];

type NavbarProps = {
  readonly brand?: string;
};

export default function Navbar({ brand }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery(`(min-width: ${TBreakpointTablet})`);
  const navRef = useRef<HTMLElement>(null);
  const progressBarRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    let ticking = false;

    const updateProgress = () => {
      const winScroll = window.scrollY || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? winScroll / height : 0;
      
      if (progressBarRef.current) {
        progressBarRef.current.style.setProperty("--scroll-scale", scrolled.toString());
      }
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateProgress);
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Initialize
    updateProgress();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isDesktop && open) {
      setTimeout(() => setOpen(false), 0);
    }
  }, [isDesktop, open]);

  useEffect(() => {
    const mainContent = document.getElementById("main-content");
    if (open) {
      document.body.style.overflow = "hidden";
      mainContent?.setAttribute("inert", "true");
    } else {
      document.body.style.overflow = "";
      mainContent?.removeAttribute("inert");
    }

    return () => {
      document.body.style.overflow = "";
      mainContent?.removeAttribute("inert");
    };
  }, [open]);

  useEffect(() => {
    if (!open) {return;}

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }

      if (e.key !== "Tab") {return;}

      const focusableElements = navRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements || focusableElements.length === 0) {return;}

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className={styles["navbar__overlay"]}
          onClick={() => {
            setOpen(false);
          }}
          aria-hidden="true"
        />
      )}
      <nav className={styles.navbar} ref={navRef}>
        <FluidContainer className={styles["navbar__container"]}>
          {/* Brand */}
          <Link 
            href="/" 
            className={styles["navbar__brand"]} 
            onClick={() => {
              setOpen(false);
            }}
          >
            <TerminalIcon className={styles["navbar__brand-icon"]} />
            <Typography variant="h3" className={styles["navbar__brand-text"]}>
              {brand || "Dival Sehgal"}
            </Typography>
          </Link>

          {/* Desktop Nav */}
          <div className={styles["navbar__nav-desktop"]}>
            {navLinks.map((l) => (
              <Link key={l.label} href={l.href} className={styles["navbar__nav-link"]}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <IconButton
            className={styles["navbar__menu-btn"]}
            onClick={() => {
              setOpen((prev) => !prev);
            }}
            edge="end"
            aria-label={open ? "Close menu" : "Open menu"}
            size="large"
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </IconButton>
        </FluidContainer>

        {open && (
          <div className={styles["navbar__mobile-menu"]}>
            {navLinks.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className={`${styles["navbar__nav-link"]} ${styles["navbar__nav-link--mobile"]}`}
                onClick={() => {
                  setOpen(false);
                }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}

        {/* Curved Progress Bar and Bottom Shape */}
        <div className={styles["navbar__curve-container"]}>
          <svg
            className={styles["navbar__curve-svg"]}
            viewBox="0 0 1440 40"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {/* Background shape for glass effect continuation */}
            <path
              d="M0 0 L1440 0 L1440 10 Q720 40 0 10 Z"
              className={styles["navbar__curve-bg"]}
            />
            {/* Progress Track (Subtle) */}
            <path
              d="M0 10 Q720 40 1440 10"
              className={styles["navbar__curve-track"]}
            />
            {/* Actual Progress Bar */}
            <path
              d="M0 10 Q720 40 1440 10"
              className={styles["navbar__curve-progress"]}
              ref={progressBarRef}
              pathLength="1"
            />
          </svg>
        </div>
      </nav>
    </>
  );
}
