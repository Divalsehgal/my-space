"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import IconButton from "@dival-sehgal/ui/icon-button";
import { CloseIcon } from "@dival-sehgal/ui/icons";
import { lockScroll, unlockScroll } from "@/lib/scroll";
import styles from "./styles.module.scss";

interface RouteModalProps {
  children: ReactNode;
  /** id of the heading inside, for aria-labelledby. */
  labelledBy: string;
  closeLabel: string;
}

/**
 * A page shown as a modal over the page it was opened from (an intercepted
 * route). Closing goes back, so the URL, Back button and focus all line up;
 * loading the URL directly renders the full page instead.
 */
export default function RouteModal({ children, labelledBy, closeLabel }: Readonly<RouteModalProps>) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialog.current;
    if (!el) {return;}
    if (!el.open) {el.showModal?.();}
    lockScroll();
    return unlockScroll;
  }, []);

  const close = useCallback(() => router.back(), [router]);

  return (
    <dialog
      ref={dialog}
      className={styles.modal}
      aria-labelledby={labelledBy}
      // Escape fires `cancel`; leave the route instead of just hiding the dialog.
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      // A click on the backdrop lands on the dialog element itself.
      onClick={(event) => {
        if (event.target === event.currentTarget) {close();}
      }}
      data-lenis-prevent
    >
      <div className={styles["modal__panel"]}>
        <IconButton className={styles["modal__close"]} onClick={close} aria-label={closeLabel}>
          <CloseIcon />
        </IconButton>
        {children}
      </div>
    </dialog>
  );
}
