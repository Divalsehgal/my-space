"use client";

import { useEffect, useRef } from "react";
import styles from "./styles.module.scss";

interface ReadingProgressBarProps {
  targetId?: string;
}

/** Fraction (0–1) of the target read, or of the whole page when there is no target. */
function readProgress(target: HTMLElement | null): number {
  if (!target) {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    return total > 0 ? window.scrollY / total : 0;
  }
  const rect = target.getBoundingClientRect();
  const total = rect.height - window.innerHeight;
  if (total <= 0) {
    return rect.top < 0 ? 1 : 0;
  }
  return -rect.top / total;
}

export default function ReadingProgressBar({ targetId = "blog-article" }: Readonly<ReadingProgressBarProps>) {
  const barRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = document.getElementById(targetId) || document.querySelector("article");
    let frame = 0;
    // Writes straight to the DOM once per frame: no React re-render per scroll event, and
    // a compositor-only transform instead of a layout-triggering width change.
    const update = () => {
      frame = 0;
      const progress = Math.min(1, Math.max(0, readProgress(target)));
      fillRef.current?.style.setProperty("transform", `scaleX(${progress})`);
      barRef.current?.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
    };
    const schedule = () => {
      if (!frame) {
        frame = requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [targetId]);

  return (
    <div
      ref={barRef}
      className={styles.barContainer}
      role="progressbar"
      aria-valuenow={0}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Reading progress"
    >
      <div ref={fillRef} className={styles.barFill} />
    </div>
  );
}
