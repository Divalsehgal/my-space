"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";
import styles from "./styles.module.scss";

/** The old About section's anchor: links to it (nav history, author bylines) open this instead. */
export const ABOUT_ID = "about";

interface HeroAboutProps {
  summary: string;
  paragraphs: string[];
  className?: string;
}

/**
 * The longer bio, folded under the hero subtitle so the intro stays one
 * screen. Opens itself when anything links to `#about`.
 */
export default function HeroAbout({ summary, paragraphs, className }: Readonly<HeroAboutProps>) {
  const root = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const open = () => {
      if (root.current) {root.current.open = true;}
    };
    const openIfTargeted = () => {
      if (window.location.hash === `#${ABOUT_ID}`) {open();}
    };
    // Lenis and next/link move to anchors without a hashchange, so catch the click too.
    const onClick = (event: MouseEvent) => {
      if ((event.target as Element | null)?.closest?.(`a[href$="#${ABOUT_ID}"]`)) {open();}
    };
    openIfTargeted();
    window.addEventListener("hashchange", openIfTargeted);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("hashchange", openIfTargeted);
      document.removeEventListener("click", onClick);
    };
  }, []);

  if (paragraphs.length === 0) {return null;}

  return (
    <details ref={root} id={ABOUT_ID} className={clsx(styles.about, className)}>
      <summary className={styles["about__summary"]}>
        {summary}
        <span className={styles["about__icon"]} aria-hidden="true" />
      </summary>
      <div className={styles["about__body"]}>
        {paragraphs.map((text, index) => (
          <p key={`${text}-${index}`}>{text}</p>
        ))}
      </div>
    </details>
  );
}
