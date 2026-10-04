"use client";

import { useState, type SyntheticEvent } from "react";
import IconButton from "@dival-sehgal/ui/icon-button";
import TextField from "@dival-sehgal/ui/text-field";
import { useT } from "@/i18n/client";
import styles from "./styles.module.scss";

type ChatComposerProps = {
  /** True while a reply is streaming: typing is allowed, sending is not. */
  readonly disabled: boolean;
  readonly onSend: (text: string) => void;
};

/** Message box with the send button. */
export default function ChatComposer({ disabled, onSend }: ChatComposerProps) {
  const t = useT();
  const [input, setInput] = useState("");
  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (input.trim()) {
      onSend(input);
      setInput("");
    }
  };
  return (
    <form onSubmit={submit} className={styles["chat-composer"]} aria-label={t("chat.inputForm")}>
      <TextField
        variant="pill"
        hideLabel
        label={t("chat.inputLabel")}
        name="message"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder={t("chat.placeholder")}
        autoComplete="off"
        endAdornment={
          <IconButton type="submit" disabled={!input.trim() || disabled} className={styles["chat-composer__send"]} aria-label={t("chat.send")}>
            <svg className={styles["chat-composer__send-icon"]} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </IconButton>
        }
      />
    </form>
  );
}
