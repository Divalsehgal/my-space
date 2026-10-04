import type { CSSProperties } from "react";
import clsx from "clsx";
import styles from "./styles.module.scss";

// Literal class names (not template strings) so PurgeCSS keeps these rules.
const VARIANT_CLASS = {
  text: styles["skeleton--text"],
  rectangular: styles["skeleton--rectangular"],
  rounded: styles["skeleton--rounded"],
  circular: styles["skeleton--circular"],
};

type SkeletonProps = {
  variant?: "text" | "rectangular" | "rounded" | "circular";
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: CSSProperties;
};

/** Shimmering placeholder that matches the shape of content still loading. */
export default function Skeleton({ variant = "text", width, height, className, style }: Readonly<SkeletonProps>) {
  return (
    <span
      aria-hidden="true"
      className={clsx(styles.skeleton, VARIANT_CLASS[variant], className)}
      style={{ width, height, ...style }}
    />
  );
}
