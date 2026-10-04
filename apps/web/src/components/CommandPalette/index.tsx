"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import clsx from "clsx";
import type { SiteIndex } from "@/lib/site-index";
import { buildItems, score, type PaletteItem } from "./items";
import styles from "./styles.module.scss";
import { useT } from "@/i18n/client";

const MAX_RESULTS = 40;

interface CommandPaletteProps {
  index: SiteIndex;
  onRun: (item: PaletteItem) => void;
  onClose: () => void;
}

/** ⌘K palette: type to filter, ↑↓ to move, Enter to run, Esc to close. */
export default function CommandPalette({ index, onRun, onClose }: Readonly<CommandPaletteProps>) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const all = useMemo(() => buildItems(index, t), [index, t]);

  const results = useMemo(
    () =>
      all
        .map((item) => ({ item, s: score(query, item) }))
        .filter((r): r is { item: PaletteItem; s: number } => r.s !== null)
        .sort((a, b) => (query ? b.s - a.s : 0))
        .map((r) => r.item)
        .slice(0, MAX_RESULTS),
    [all, query],
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((current) => (current + step + results.length) % Math.max(results.length, 1));
    } else if (event.key === "Enter" && results[active]) {
      event.preventDefault();
      onRun(results[active]);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.palette}
        role="dialog"
        aria-modal="true"
        aria-label={t("palette.label")}
        onClick={(event) => event.stopPropagation()}
      >
        <input
          ref={inputRef}
          className={styles["palette__input"]}
          placeholder={t("palette.placeholder")}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-results"
          aria-activedescendant={results[active] ? `palette-${results[active].id}` : undefined}
          autoComplete="off"
          spellCheck={false}
        />
        <ul ref={listRef} id="palette-results" role="listbox" className={styles["palette__list"]}>
          {results.length === 0 && <li className={styles["palette__empty"]}>{t("palette.empty", { query })}</li>}
          {results.map((item, i) => {
            const header = i === 0 || results[i - 1].group !== item.group ? item.group : null;
            return (
              <li key={item.id} role="presentation">
                {header && <p className={styles["palette__group"]} aria-hidden="true">{header}</p>}
                <div
                  id={`palette-${item.id}`}
                  role="option"
                  aria-selected={i === active}
                  data-index={i}
                  className={clsx(styles["palette__item"], i === active && styles["palette__item--active"])}
                  onMouseMove={() => setActive(i)}
                  onClick={() => onRun(item)}
                >
                  <span className={styles["palette__label"]}>{item.label}</span>
                  {item.hint && <span className={styles["palette__hint"]}>{item.hint}</span>}
                </div>
              </li>
            );
          })}
        </ul>
        <p className={styles["palette__footer"]}>
          <kbd>↑</kbd><kbd>↓</kbd> {t("palette.keyMove")} <kbd>↵</kbd> {t("palette.keyRun")} <kbd>esc</kbd> {t("palette.keyClose")} · <kbd>`</kbd> {t("palette.keyTerminal")}
        </p>
      </div>
    </div>
  );
}
