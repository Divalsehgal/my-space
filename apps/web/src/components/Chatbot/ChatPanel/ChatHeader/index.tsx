"use client";

import IconButton from "@dival-sehgal/ui/icon-button";
import { useT } from "@/i18n/client";
import styles from "./styles.module.scss";

type ChatHeaderProps = {
  readonly canClear: boolean;
  readonly onClear: () => void;
  readonly onShowOptions: () => void;
};

/** Assistant name, online status, "back to options" and "new chat" buttons. */
export default function ChatHeader({ canClear, onClear, onShowOptions }: ChatHeaderProps) {
  const t = useT();
  return (
    <div className={styles["chat-header"]}>
      <div className={styles["chat-header__info"]}>
        <div className={styles["chat-header__mark"]} aria-hidden="true">{">_"}</div>
        <div>
          <h3 className={styles["chat-header__title"]}>{t("chat.assistantName")}</h3>
          <div className={styles["chat-header__status"]}>
            <span className={styles["chat-header__status-dot"]} />
            <span className={styles["chat-header__status-text"]}>{t("chat.online")}</span>
          </div>
        </div>
      </div>
      <div className={styles["chat-header__actions"]}>
        {canClear && (
          <IconButton
            size="small"
            onClick={onShowOptions}
            className={styles["chat-header__clear"]}
            aria-label={t("chat.backToOptions")}
            title={t("chat.backToOptions")}
          >
            <svg className={styles["chat-header__clear-icon"]} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </IconButton>
        )}
        {canClear && (
          <IconButton
            size="small"
            onClick={onClear}
            className={styles["chat-header__clear"]}
            aria-label={t("chat.newChatLabel")}
            title={t("chat.newChat")}
          >
            <svg className={styles["chat-header__clear-icon"]} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-1 0v14a2 2 0 01-2 2H8a2 2 0 01-2-2V6h12z" />
            </svg>
          </IconButton>
        )}
      </div>
    </div>
  );
}
