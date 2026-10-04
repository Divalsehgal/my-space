"use client";

import { useT } from "@/i18n/client";
import styles from "./styles.module.scss";

/** First-open screen: what the assistant can do, plus one-tap starter questions. */
export default function ChatEmptyState({ onSuggest }: Readonly<{ onSuggest: (text: string) => void }>) {
  const t = useT();
  const suggestions = [
    t("chat.suggestion.about"),
    t("chat.suggestion.projects"),
    t("chat.suggestion.contact"),
    t("chat.suggestion.message"),
  ];
  return (
    <div className={styles["chat-empty"]}>
      <div className={styles["chat-empty__icon"]}>
        <svg className={styles["chat-empty__icon-svg"]} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
        </svg>
      </div>
      <h4 className={styles["chat-empty__title"]}>{t("chat.emptyTitle")}</h4>
      <p className={styles["chat-empty__copy"]}>{t("chat.emptyCopy")}</p>
      <div className={styles["chat-empty__suggestions"]}>
        {suggestions.map((suggestion) => (
          <button key={suggestion} type="button" onClick={() => onSuggest(suggestion)} className={styles["chat-empty__suggestion"]}>
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
