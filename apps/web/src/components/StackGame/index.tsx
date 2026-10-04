"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import dynamic from "next/dynamic";
import clsx from "clsx";
import type { StackGameApi } from "./Scene";
import { trackInteraction, ANALYTICS_EVENTS } from "@/utils/analytics";
import styles from "./styles.module.scss";
import { useT } from "@/i18n/client";

// three.js is client-only and loads after the hero copy.
const StackGameScene = dynamic(() => import("./Scene"), { ssr: false });

const BEST_KEY = "stack-game-best";
const TAP_SLOP = 12; // px a touch may move and still count as a tap

type Status = "idle" | "playing" | "over";

interface StackGameProps {
  /** Tech names shown as blocks are placed. */
  items: string[];
  className?: string;
  /** Focus the game on mount so Space/Enter work immediately (modal use). */
  autoFocus?: boolean;
}

/**
 * "Build the stack": tap / click / Space drops the sliding block; overhangs
 * are sliced off. Every block placed is one item from the tech stack.
 */
export default function StackGame({ items, className, autoFocus = false }: Readonly<StackGameProps>) {
  const t = useT();
  const api = useRef<StackGameApi | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const attempts = useRef(0);
  const [status, setStatus] = useState<Status>("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [toast, setToast] = useState<{ key: number; text: string; perfect: boolean } | null>(null);
  const [inView, setInView] = useState(true);

  // Best score lives in this visitor's browser only.
  useEffect(() => {
    try {
      const stored = Number(localStorage.getItem(BEST_KEY) ?? 0);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored > 0) {setBest(stored);}
    } catch {
      // Storage unavailable: best score just isn't remembered.
    }
  }, []);

  useEffect(() => {
    if (autoFocus) {root.current?.focus({ preventScroll: true });}
  }, [autoFocus]);

  // Stop rendering while the game is scrolled out of view.
  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === "undefined") {return;}
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleReady = useCallback((gameApi: StackGameApi) => {
    api.current = gameApi;
  }, []);

  const handlePlaced = useCallback(
    (height: number, perfect: boolean) => {
      setScore(height);
      const tech = items.length > 0 ? items[(height - 1) % items.length] : t("game.block", { number: height });
      setToast({ key: height, text: perfect ? t("game.perfect", { tech }) : `+ ${tech}`, perfect });
    },
    [items, t],
  );

  const handleGameOver = useCallback((height: number) => {
    setStatus("over");
    setBest((previous) => {
      const next = Math.max(previous, height);
      try {
        localStorage.setItem(BEST_KEY, String(next));
      } catch {
        // Ignore storage failures.
      }
      trackInteraction(ANALYTICS_EVENTS.GAME_OVER, { score: height, best: next });
      return next;
    });
  }, []);

  const act = useCallback(() => {
    if (!api.current) {return;}
    if (status === "playing") {
      api.current.drop();
      return;
    }
    attempts.current += 1;
    trackInteraction(ANALYTICS_EVENTS.GAME_START, { attempt: attempts.current });
    api.current.reset();
    setScore(0);
    setToast(null);
    setStatus("playing");
  }, [status]);

  // A tap drops a block; a swipe is left alone so the page still scrolls.
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    pointerStart.current = { x: event.clientX, y: event.clientY };
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start) {return;}
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) <= TAP_SLOP) {act();}
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      act();
    }
  };

  return (
    <div // NOSONAR: role="application" game surface — it is interactive (Space/Enter and tap both play)
      ref={root}
      className={clsx(styles.game, className)}
      role="application"
      tabIndex={0} // NOSONAR: the game must take keyboard focus to be playable
      aria-label={t("game.ariaLabel")}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (pointerStart.current = null)}
      onKeyDown={onKeyDown}
    >
      <StackGameScene
        active={inView}
        onReady={handleReady}
        onPlaced={handlePlaced}
        onGameOver={handleGameOver}
      />

      <div className={styles["game__hud"]} aria-live="polite">
        {status !== "idle" && <span className={styles["game__score"]}>{score}</span>}
        {status === "playing" && toast && (
          <span
            key={toast.key}
            className={clsx(styles["game__toast"], toast.perfect && styles["game__toast--perfect"])}
          >
            {toast.text}
          </span>
        )}
      </div>

      {status !== "playing" && (
        <div className={styles["game__panel"]}>
          {status === "idle" ? (
            <>
              <p className={styles["game__title"]}>{t("game.title")}</p>
              <p className={styles["game__hint"]}>
                {t("game.intro")}
              </p>
            </>
          ) : (
            <>
              <p className={styles["game__title"]}>
                {t.plural("game.blocks", score)}
              </p>
              <p className={styles["game__hint"]}>{score === best && score > 0 ? t("game.newBest") : t("game.best", { best })}</p>
            </>
          )}
          <span className={styles["game__cta"]}>{t(status === "idle" ? "game.play" : "game.playAgain")}</span>
        </div>
      )}
    </div>
  );
}
