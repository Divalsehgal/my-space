"use client";

import clsx from "clsx";
import ReactMarkdown from "react-markdown";
import { useT } from "@/i18n/client";
import type { Message } from "../../hooks/useChat";
import styles from "./styles.module.scss";

type ChatMessageProps = {
  readonly message: Message;
  readonly onRetry: () => void;
};

/** One chat bubble: the visitor's text, or the assistant's markdown reply. */
export default function ChatMessage({ message, onRetry }: ChatMessageProps) {
  const t = useT();
  const fromUser = message.role === "user";
  return (
    <div className={clsx(styles["chat-message"], fromUser ? styles["chat-message--user"] : styles["chat-message--assistant"])}>
      <div
        className={clsx(
          styles["chat-message__bubble"],
          fromUser ? styles["chat-message__bubble--user"] : styles["chat-message__bubble--assistant"],
          message.isError && styles["chat-message__bubble--error"],
        )}
      >
        {!fromUser && (
          <div className={styles["chat-message__meta"]}>
            <div className={styles["chat-message__avatar"]}>{t("common.siteName").charAt(0)}</div>
            <span className={styles["chat-message__author"]}>{t("chat.assistantName")}</span>
          </div>
        )}
        {fromUser ? (
          <div>{message.content}</div>
        ) : (
          <div className={styles["chat-message__markdown"]}>
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
        {message.isError && (
          <button type="button" onClick={onRetry} className={styles["chat-message__retry"]}>
            {t("chat.retry")}
          </button>
        )}
      </div>
    </div>
  );
}
