"use client";

import * as Toast from "@radix-ui/react-toast";
import clsx from "clsx";
import type { ToastSeverity } from "@/types/contact";
import { CloseIcon } from "@dival-sehgal/ui/icons";
import styles from "./styles.module.scss";
import { useT } from "@/i18n/client";

/** How long a toast stays on screen. */
export const TOAST_DURATION_MS = 5000;

// Literal class names (not template strings) so PurgeCSS keeps these rules.
const SEVERITY_CLASS: Record<ToastSeverity, string> = {
  success: styles["toast--success"],
  error: styles["toast--error"],
  info: styles["toast--info"],
  warning: styles["toast--warning"],
};

interface ToasterProps {
  open: boolean;
  message: string;
  severity: ToastSeverity;
  onClose: (event?: React.SyntheticEvent | Event, reason?: string) => void;
}

/**
 * Status toast (Radix): announced to screen readers, dismissible by swipe,
 * Escape or the close button, and auto-hidden after five seconds.
 */
export const Toaster: React.FC<ToasterProps> = ({ open, message, severity, onClose }) => {
  const t = useT();
  return (
    <Toast.Provider swipeDirection="up" duration={TOAST_DURATION_MS}>
      <Toast.Root
        open={open}
        onOpenChange={(next) => {
          if (!next) {onClose();}
        }}
        type={severity === "error" ? "foreground" : "background"}
        className={clsx(styles.toast, SEVERITY_CLASS[severity])}
      >
        <Toast.Description className={styles["toast__message"]}>{message}</Toast.Description>
        <Toast.Close className={styles["toast__close"]} aria-label={t("toast.close")}>
          <CloseIcon fontSize="small" />
        </Toast.Close>
      </Toast.Root>
      <Toast.Viewport className={styles["toast__viewport"]} />
    </Toast.Provider>
  );
};
