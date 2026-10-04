import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";
import { omitLinkProps } from "../omitLinkProps";
import Spinner from "../Spinner";
import styles from "./styles.module.scss";

const SPINNER_SIZE = 14;

// Literal class names (not template strings) so PurgeCSS keeps these rules.
const VARIANT_CLASS = {
  contained: styles["button--contained"],
  outlined: styles["button--outlined"],
  text: styles["button--text"],
};
const SIZE_CLASS = {
  small: styles["button--small"],
  medium: styles["button--medium"],
  large: styles["button--large"],
};

type ButtonOwnProps = {
  variant?: "contained" | "outlined" | "text";
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
  /** Shows a spinner in place of startIcon, sets aria-busy and blocks clicks. */
  loading?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  className?: string;
  children: ReactNode;
};

type LinkProps = Pick<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "target" | "rel" | "download">;

/** Renders an <a> when href is set, otherwise a <button>. */
export type ButtonProps = ButtonOwnProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonOwnProps> & LinkProps;

type ContentProps = Pick<ButtonOwnProps, "loading" | "startIcon" | "endIcon" | "children">;

/** Icon slots and label; the start icon becomes a spinner while loading. */
function ButtonContent({ loading, startIcon, endIcon, children }: Readonly<ContentProps>) {
  const leading = loading ? <Spinner size={SPINNER_SIZE} className={styles["button__spinner"]} /> : startIcon;
  return (
    <>
      {leading && <span className={styles["button__icon"]}>{leading}</span>}
      {children}
      {endIcon && <span className={styles["button__icon"]}>{endIcon}</span>}
    </>
  );
}

/** Token-styled button; renders an <a> when given an href. */
export default function Button(props: ButtonProps) {
  const { variant = "contained", size = "medium", fullWidth = false, loading = false, startIcon, endIcon, className, children, ...rest } = props;
  const classes = clsx(styles.button, VARIANT_CLASS[variant], SIZE_CLASS[size], fullWidth && styles["button--full"], loading && styles["button--loading"], className);
  const content = (
    <ButtonContent loading={loading} startIcon={startIcon} endIcon={endIcon}>
      {children}
    </ButtonContent>
  );

  if (rest.href !== undefined) {
    return (
      <a
        {...(rest as unknown as AnchorHTMLAttributes<HTMLAnchorElement>)}
        className={classes}
        aria-busy={loading || undefined}
        aria-disabled={loading || undefined}
        onClick={loading ? (event) => event.preventDefault() : (rest.onClick as AnchorHTMLAttributes<HTMLAnchorElement>["onClick"])}
      >
        {content}
      </a>
    );
  }
  const { type = "button", disabled, ...buttonProps } = omitLinkProps(rest);
  return (
    <button type={type} {...buttonProps} disabled={disabled || loading} aria-busy={loading || buttonProps["aria-busy"]} className={classes}>
      {content}
    </button>
  );
}
