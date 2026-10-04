import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";
import { omitLinkProps } from "../omitLinkProps";
import styles from "./styles.module.scss";

// Literal class names (not template strings) so PurgeCSS keeps these rules.
const SIZE_CLASS = {
  small: styles["icon-button--small"],
  medium: styles["icon-button--medium"],
  large: styles["icon-button--large"],
};
const VARIANT_CLASS = {
  ghost: undefined,
  glass: styles["icon-button--glass"],
};

type IconButtonOwnProps = {
  /** Required: icon-only controls need an accessible name. */
  "aria-label": string;
  size?: "small" | "medium" | "large";
  /** "ghost" (default) is a transparent round button; "glass" is a bordered square with a hover glow. */
  variant?: "ghost" | "glass";
  className?: string;
  children: ReactNode;
};

type LinkProps = Pick<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "target" | "rel">;

type IconButtonProps = IconButtonOwnProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof IconButtonOwnProps> &
  LinkProps;

/** Round, icon-only button; renders an <a> when given an href. */
export default function IconButton(props: IconButtonProps) {
  const { size = "medium", variant = "ghost", className, children, ...rest } = props;
  const classes = clsx(styles["icon-button"], SIZE_CLASS[size], VARIANT_CLASS[variant], className);

  if (rest.href !== undefined) {
    return (
      <a {...(rest as unknown as AnchorHTMLAttributes<HTMLAnchorElement>)} className={classes}>
        {children}
      </a>
    );
  }
  const { type = "button", ...buttonProps } = omitLinkProps(rest);
  return (
    <button type={type} {...buttonProps} className={classes}>
      {children}
    </button>
  );
}
