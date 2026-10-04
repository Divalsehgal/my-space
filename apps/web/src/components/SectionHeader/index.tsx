import { ReactNode } from "react";

import clsx from "clsx";
import styles from "./styles.module.scss";

// Literal class names (not template strings) so PurgeCSS keeps these rules.
const ALIGN_CLASS = {
  left: styles["section-header--left"],
  center: styles["section-header--center"],
};
const VARIANT_CLASS = {
  default: undefined,
  contact: styles["section-header--contact"],
};

type SectionHeaderProps = {
  eyebrow?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  align?: "left" | "center";
  variant?: "default" | "contact";
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  action?: {
    label?: string;
    href: string;
    icon?: ReactNode;
  };
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
  if (!eyebrow && !title && !subtitle) {
    return null;
  }

  const rootClassNames = clsx(
    styles["section-header"],
    ALIGN_CLASS[align],
    VARIANT_CLASS[variant],
    className,
  );

  const titleClasses = clsx(styles["section-header__title"], titleClassName);

  const subtitleClasses = clsx(
    styles["section-header__subtitle"],
    subtitleClassName,
  );

  return (
    <div className={rootClassNames}>
      <div className={styles["section-header__content"]}>
        {eyebrow && (
          <span className={styles["section-header__eyebrow"]}>
            {eyebrow}
          </span>
        )}

        {title && (
          <h2 className={titleClasses} data-split>
            {title}
          </h2>
        )}

        {subtitle && (
          <p className={subtitleClasses} data-reveal>{subtitle}</p>
        )}
      </div>
    </div>
  );
}
