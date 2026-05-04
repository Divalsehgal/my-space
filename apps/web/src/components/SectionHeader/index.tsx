"use client";

import { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import clsx from "clsx";
import styles from "./styles.module.scss";

type SectionHeaderProps = {
  eyebrow?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  align?: "left" | "center";
  variant?: "default" | "contact";
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
};

export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "left",
  variant = "default",
  className,
  titleClassName,
  subtitleClassName,
}: Readonly<SectionHeaderProps>) {
  if (!eyebrow && !title && !subtitle) {return null;}

  const rootClassNames = clsx(
    styles["section-header"],
    styles[`section-header--${align}`],
    variant !== "default" && styles[`section-header--${variant}`],
    className
  );
 
  const titleClasses = clsx(styles["section-header__title"], titleClassName);
 
  const subtitleClasses = clsx(styles["section-header__subtitle"], subtitleClassName);

  return (
    <Box className={rootClassNames}>
      {eyebrow && (
        <Typography
          component="span"
          className={styles["section-header__eyebrow"]}
        >
          {eyebrow}
        </Typography>
      )}

      {title && (
        <Typography className={titleClasses} component="h2" variant="h2">
          {title}
        </Typography>
      )}

      {subtitle && (
        <Typography className={subtitleClasses}>{subtitle}</Typography>
      )}
    </Box>
  );
}
