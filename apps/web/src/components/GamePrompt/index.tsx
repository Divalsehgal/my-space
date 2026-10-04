"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import IconButton from "@dival-sehgal/ui/icon-button";
import { CloseIcon, GameIcon as SportsEsportsIcon } from "@dival-sehgal/ui/icons";
import StackGame from "@/components/StackGame";
import { lockScroll, unlockScroll } from "@/lib/scroll";
import { SITE_EVENTS } from "@/lib/site-events";
import { trackInteraction, ANALYTICS_EVENTS } from "@/utils/analytics";
import { useT } from "@/i18n/client";
import styles from "./styles.module.scss";

interface GamePromptProps {
  items: string[];
}

/**
 * A small floating "Play" pill that opens the stack game in a modal. The game
 * only ever starts from this button; nothing pops up on its own.
 */
export default function GamePrompt({ items }: Readonly<GamePromptProps>) {
  const t = useT();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const returnFocus = useRef<HTMLElement | null>(null);

  const openGame = useCallback(() => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    trackInteraction(ANALYTICS_EVENTS.GAME_PROMPT, { action: "play" });
    setOpen(true);
  }, []);

  // The command palette and terminal can launch the game too.
  useEffect(() => {
    window.addEventListener(SITE_EVENTS.openGame, openGame);
    return () => window.removeEventListener(SITE_EVENTS.openGame, openGame);
  }, [openGame]);

  const closeGame = useCallback(() => {
    setOpen(false);
    returnFocus.current?.focus?.({ preventScroll: true });
  }, []);

  // Modal: freeze the page behind it, close on Escape.
  useEffect(() => {
    if (!open) {return;}
    lockScroll();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {closeGame();}
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      unlockScroll();
    };
  }, [open, closeGame]);

  const spring = reduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 260, damping: 22 };

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            key="launcher"
            type="button"
            className={styles.launcher}
            onClick={openGame}
            aria-label={t("game.launch")}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={spring}
          >
            <SportsEsportsIcon fontSize="small" />
            <span>{t("game.launchShort")}</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            key="modal"
            className={styles.backdrop}
            onClick={closeGame}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={styles.modal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="game-modal-title"
              onClick={(event) => event.stopPropagation()}
              initial={{ opacity: 0, y: 48, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 32, scale: 0.96 }}
              transition={spring}
            >
              <header className={styles["modal__header"]}>
                <div>
                  <h2 id="game-modal-title" className={styles["modal__title"]}>
                    {t("game.title")}
                  </h2>
                  <p className={styles["modal__subtitle"]}>
                    {t("game.subtitle")}
                    <span className={styles["modal__key-hint"]}> {t("game.keyHint")}</span>
                  </p>
                </div>
                <IconButton className={styles["modal__close"]} aria-label={t("game.close")} onClick={closeGame}>
                  <CloseIcon />
                </IconButton>
              </header>
              <StackGame items={items} autoFocus className={styles["modal__game"]} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
