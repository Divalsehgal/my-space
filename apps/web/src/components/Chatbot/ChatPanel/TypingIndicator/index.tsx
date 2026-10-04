import styles from "./styles.module.scss";

/** Three bouncing dots while waiting for the assistant's first token. */
export default function TypingIndicator() {
  return (
    <div className={styles["typing-indicator"]} aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}
