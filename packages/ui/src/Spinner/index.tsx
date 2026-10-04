import clsx from "clsx";
import styles from "./styles.module.scss";

type SpinnerProps = {
  size?: number;
  /** Announced as a progress indicator when set; without it the ring is decorative. */
  "aria-label"?: string;
  className?: string;
};

/** Small indeterminate progress ring. Server-safe: callers pass translated labels. */
export default function Spinner({ size = 16, className, "aria-label": label }: Readonly<SpinnerProps>) {
  return (
    <span
      role={label ? "progressbar" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={clsx(styles.spinner, className)}
      style={{ width: size, height: size }}
    />
  );
}
