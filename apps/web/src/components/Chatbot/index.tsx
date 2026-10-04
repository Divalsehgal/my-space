"use client";

import { useCallback, useEffect, useState } from "react";
import { SITE_EVENTS } from "@/lib/site-events";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./styles.module.scss";
import { useT } from "@/i18n/client";

const ChatPanel = dynamic(() => import("./ChatPanel"), { ssr: false });

export default function Chatbot() {
  const t = useT();
  const [isOpen, setIsOpen] = useState(false);
  // Fetched on first open only; then kept mounted (see ChatPanel).
  const [hasOpened, setHasOpened] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const clearPending = useCallback(() => setPending(null), []);

  // The command palette and terminal can open the chat, optionally with a question.
  useEffect(() => {
    const onOpen = (event: Event) => {
      const message = (event as CustomEvent<{ message?: string } | undefined>).detail?.message;
      setHasOpened(true);
      setIsOpen(true);
      if (message) {setPending(message);}
    };
    window.addEventListener(SITE_EVENTS.openChat, onOpen);
    return () => window.removeEventListener(SITE_EVENTS.openChat, onOpen);
  }, []);

  return (
    <div className={styles["chatbot"]}>
        {/* Toggle Button */}
        <button
          type="button"
          onClick={() => {
            setHasOpened(true);
            setIsOpen(!isOpen);
          }}
          className={styles["chatbot__toggle"]}
          aria-label={t("chat.toggle")}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.svg
                key="close"
                initial={{ opacity: 0, rotate: 45, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: -45, scale: 0.5 }}
                style={{ width: "24px", height: "24px" }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </motion.svg>
            ) : (
              <motion.svg
                key="open"
                initial={{ opacity: 0, rotate: -45, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 45, scale: 0.5 }}
                style={{ width: "24px", height: "24px" }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
              </motion.svg>
            )}
          </AnimatePresence>
        </button>

        {hasOpened && <ChatPanel open={isOpen} pendingMessage={pending} onPendingSent={clearPending} />}
    </div>
  );
}
