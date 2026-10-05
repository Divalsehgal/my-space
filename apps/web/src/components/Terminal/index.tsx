"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import type { SiteIndex } from "@/lib/site-index";
import { emitSiteEvent, SITE_EVENTS } from "@/lib/site-events";
import { useThemeContext } from "@/context/ThemeContext";
import { complete, runCommand, type TerminalAction } from "./commands";
import styles from "./styles.module.scss";
import { useT } from "@/i18n/client";

const HISTORY_LIMIT = 50;
/** Shell-style prompt, e.g. "visitor@dival: ~" (not translated: it mimics a terminal). */
const PROMPT_USER = "visitor";

type Line = { id: number; text: string; kind: "in" | "out" };

// Literal class names so PurgeCSS keeps them.
const LINE_CLASS = {
  in: styles["terminal__line--in"],
  out: styles["terminal__line--out"],
};

interface TerminalProps {
  index: SiteIndex;
  onClose: () => void;
}

/** A working shell for the site: `help`, `ls`, `cd`, `open`, `ask`, … */
export default function Terminal({ index, onClose }: Readonly<TerminalProps>) {
  const t = useT();
  const router = useRouter();
  const { mode, toggleTheme } = useThemeContext();
  const nextId = useRef(0);
  const line = (text: string, kind: Line["kind"] = "out"): Line => ({ id: nextId.current++, text, kind });
  // The greeting gets a fixed id: refs can't be read while rendering.
  const [lines, setLines] = useState<Line[]>(() => [
    { id: -1, text: t("terminal.welcome", { name: index.name }), kind: "out" },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    screenRef.current?.scrollTo({ top: screenRef.current.scrollHeight });
  }, [lines]);

  const ask = (question: string) => {
    setLines((prev) => [...prev, line(t("terminal.handingOff"))]);
    emitSiteEvent(SITE_EVENTS.openChat, { message: question });
    onClose();
  };

  const perform = (action?: TerminalAction) => {
    if (!action) {return;}
    switch (action.type) {
      case "navigate":
        router.push(action.href);
        onClose();
        break;
      case "open":
        window.open(action.href, "_blank", "noopener,noreferrer");
        break;
      case "theme":
        if (!action.mode || action.mode !== mode) {toggleTheme();}
        break;
      case "copy":
        navigator.clipboard?.writeText(action.text).catch(() => undefined);
        break;
      case "game":
        emitSiteEvent(SITE_EVENTS.openGame);
        onClose();
        break;
      case "clear":
        setLines([]);
        break;
      case "exit":
        onClose();
        break;
      case "ask":
        ask(action.question);
        break;
    }
  };

  const submit = (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    event.preventDefault();
    const result = runCommand(input, index, t);
    setLines((prev) => [...prev, line(input, "in"), ...result.lines.map((text) => line(text))]);
    if (input.trim()) {setHistory((prev) => [input, ...prev].slice(0, HISTORY_LIMIT));}
    setCursor(-1);
    setInput("");
    perform(result.action);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Tab") {
      event.preventDefault();
      setInput((value) => complete(value, index));
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const next = Math.max(-1, Math.min(history.length - 1, cursor + (event.key === "ArrowUp" ? 1 : -1)));
      setCursor(next);
      setInput(next === -1 ? "" : history[next]);
    } else if (event.key === "l" && event.ctrlKey) {
      event.preventDefault();
      setLines([]);
    }
  };

  return (
    <dialog open className={styles.terminal} aria-modal="true" aria-label={t("terminal.label")}>
      <div className={styles["terminal__bar"]}>
        <span className={styles["terminal__dots"]} aria-hidden="true"><i /><i /><i /></span>
        <span>{`${PROMPT_USER}@${index.name.split(" ")[0].toLowerCase()}: ~`}</span>
        <button type="button" className={styles["terminal__close"]} onClick={onClose} aria-label={t("terminal.close")}>
          esc
        </button>
      </div>
      {/* Click-anywhere-to-type for pointer users; keyboard focus is already in the input. */}
      <div // NOSONAR: pointer-only convenience — keyboard focus already sits in the input
        ref={screenRef}
        className={styles["terminal__screen"]}
        onClick={() => inputRef.current?.focus()}
      >
        <div role="log" aria-live="polite">
          {lines.map((l) => (
            <pre key={l.id} className={LINE_CLASS[l.kind]}>
              {l.kind === "in" ? `$ ${l.text}` : l.text}
            </pre>
          ))}
        </div>
        <form onSubmit={submit} className={styles["terminal__prompt"]}>
          <label htmlFor="terminal-input">$</label>
          <input
            id="terminal-input"
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label={t("terminal.inputLabel")}
          />
        </form>
      </div>
    </dialog>
  );
}
