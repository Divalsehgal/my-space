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
