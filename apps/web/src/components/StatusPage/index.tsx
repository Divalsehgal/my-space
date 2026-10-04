import type { ReactNode } from "react";
import styles from "./styles.module.scss";

type StatusPageProps = {
  title: string;
  description: ReactNode;
  /** Big faded watermark behind the content, e.g. "404". */
  watermark?: string;
  icon?: ReactNode;
  /** Buttons or links, laid out as a centred row. */
  actions?: ReactNode;
  /** Technical details (dev only), shown in a scrollable code block. */
  debug?: string;
  children?: ReactNode;
};

/** Centred full-height message used by the 404 and error pages. */
export default function StatusPage({ title, description, watermark, icon, actions, debug, children }: Readonly<StatusPageProps>) {
  return (
    <div className={styles.status}>
      {watermark && (
        <span className={styles["status__watermark"]} aria-hidden="true">
          {watermark}
        </span>
      )}
      <div className={styles["status__card"]}>
        {icon && <div className={styles["status__icon"]}>{icon}</div>}
        <h1 className={styles["status__title"]}>{title}</h1>
        <p className={styles["status__description"]}>{description}</p>
        {children}
        {debug && <pre className={styles["status__debug"]}>{debug}</pre>}
        {actions && <div className={styles["status__actions"]}>{actions}</div>}
      </div>
    </div>
  );
}
