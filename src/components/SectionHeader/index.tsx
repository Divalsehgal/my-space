"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import styles from "./styles.module.scss";

type SectionHeaderProps = {
  eyebrow?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
};

export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "left",
  className,
  titleClassName,
  subtitleClassName,
}: Readonly<SectionHeaderProps>) {
  if (!eyebrow && !title && !subtitle) return null;

  const rootClassNames = [
    styles["section-header"],
    styles[`section-header--${align}`],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const titleClasses = [styles["section-header__title"], titleClassName]
    .filter(Boolean)
    .join(" ");

  const subtitleClasses = [
    styles["section-header__subtitle"],
    subtitleClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Box className={rootClassNames}>
      {eyebrow && (
        <Typography
          component="p"
          variant="h2"
          className={styles["section-header__eyebrow"]}
        >
          {eyebrow}
        </Typography>
      )}

      {title && (
        <Typography className={titleClasses} component="h2" variant="h1">
          {title}
        </Typography>
      )}

      {subtitle && (
        <Typography className={subtitleClasses}>{subtitle}</Typography>
      )}
    </Box>
  );
}
