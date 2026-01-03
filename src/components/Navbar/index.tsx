"use client";

import Link from "next/link";
import { AppBar, Toolbar, IconButton, Button } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import styles from "./styles.module.scss";
import { useState } from "react";

const navLinks = [
  { label: "About", href: "#about" },
  { label: "Projects", href: "#projects" },
  { label: "Experience", href: "#experience" },
  { label: "Contact", href: "#contact", cta: true },
];
export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <AppBar position="sticky" color="transparent" className={styles["appbar"]}>
      <Toolbar className={styles["toolbar"]}>
        <div className={styles["brand"]}>
          <Link href="/" className={styles["logo"]}>
            Dival<span className={styles["logo-accent"]}>Sehgal</span>
          </Link>
        </div>

        <nav className={styles["nav"]}>
          {navLinks.map((l) =>
            l.cta ? (
              <Link key={l.href} href={l.href} className={styles["cta-link"]}>
                <Button variant="contained" size="small">
                  {l.label}
                </Button>
              </Link>
            ) : (
              <Link key={l.href} href={l.href} className={styles["nav-link"]}>
                {l.label}
              </Link>
            )
          )}
        </nav>

        <IconButton
          edge="end"
          className={styles["menu-btn"]}
          onClick={() => setOpen((v) => !v)}
          aria-label="menu"
        >
          <MenuIcon />
        </IconButton>
      </Toolbar>

      {/* Simple mobile drawer / menu (toggle) */}
      {open && (
        <div className={styles["mobile-menu"]}>
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </AppBar>
  );
}
