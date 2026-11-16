"use client";

import { useEffect, useState } from "react";
import styles from "./styles.module.scss";

interface ReadingProgressBarProps {
  targetId?: string;
}

export default function ReadingProgressBar({ targetId = "blog-article" }: Readonly<ReadingProgressBarProps>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const target = document.getElementById(targetId) || document.querySelector("article");
      if (!target) {
        const scrollY = window.scrollY;
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(totalHeight > 0 ? Math.min(100, Math.max(0, (scrollY / totalHeight) * 100)) : 0);
        return;
      }
      const rect = target.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) {
        setProgress(rect.top < 0 ? 100 : 0);
        return;
      }
      const current = -rect.top;
      const pct = Math.min(100, Math.max(0, (current / total) * 100));
      setProgress(pct);
    };

    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    updateProgress();
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [targetId]);

  return (
    <div
      className={styles.barContainer}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Reading progress"
    >
      <div className={styles.barFill} style={{ width: `${progress}%` }} />
    </div>
  );
}
