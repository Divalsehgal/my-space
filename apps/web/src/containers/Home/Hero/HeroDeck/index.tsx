"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { ArticleIcon as ArticleOutlinedIcon, BoltIcon, WorkIcon as WorkOutlineIcon } from "@dival-sehgal/ui/icons";
import { animate } from "framer-motion";
import { EASE_OUT_EXPO, motionAllowed } from "@/lib/motion";
import styles from "./styles.module.scss";
import { useT } from "@/i18n/client";
import { matchesMedia } from "@dival-sehgal/utils/dom";
import { TBreakpointTablet } from "@dival-sehgal/design-tokens/variables.js";

export type HeroHighlights = {
  latestPost?: { slug: string; title: string; relativeLabel?: string | null };
  currentRole?: { role: string; company: string };
  skills: string[];
};

type Card = { key: string; tone: "photo" | "brand" | "neutral" | "warm"; icon?: ReactNode; label?: string; body: ReactNode };

// Resting slots: front card first. Fanned slots spread the deck on hover.
// One slot per card (portrait, role, skills, blog).
const STACKED = [
  { x: 0, y: 0, rotation: -3, scale: 1 },
  { x: 22, y: 16, rotation: 3, scale: 0.96 },
  { x: 44, y: 32, rotation: 8, scale: 0.92 },
  { x: 66, y: 48, rotation: 13, scale: 0.88 },
];
const FANNED = [
  { x: -100, y: -12, rotation: -10, scale: 1 },
  { x: 0, y: 8, rotation: -2, scale: 0.97 },
  { x: 95, y: 28, rotation: 6, scale: 0.94 },
  { x: 180, y: 50, rotation: 13, scale: 0.91 },
];
const INITIAL_ORDER = STACKED.map((_, index) => index);
const CYCLE_MS = 4500;

const MAX_SKILL_CHIPS = 6;
/** z-index of the front card; cards behind it count down from here. */
const TOP_Z_INDEX = 10;
/** Load-in: cards fly in from the lower right, back card first. Seconds and px. */
const DEAL = { fromX: 80, fromY: 120, fromRotation: 20, duration: 1.2, delay: 0.6, stagger: 0.12 } as const;
/** Auto-rotation: the front card is tossed off to the right before reshuffling. */
const TOSS = { x: 220, y: -30, rotation: 18, duration: 0.35 } as const;
const RESHUFFLE_SECONDS = 0.7;

/** The stacked deck is for tablet and up; phones get a swipeable row (CSS). */
const deckLayout = () => matchesMedia(`(min-width: ${TBreakpointTablet})`);

// Literal class names (not template strings) so PurgeCSS keeps these rules.
const TONE_CLASS = {
  photo: styles["deck__card--photo"],
  brand: styles["deck__card--brand"],
  neutral: undefined,
  warm: styles["deck__card--warm"],
};

/**
 * Hero side panel: a portrait on top of a small deck of real highlights
 * (current role, daily-driver skills, latest post). Cards deal in on load,
 * rotate on their own, fan out on hover, and come to the front when clicked
 * or tapped.
 */
export default function HeroDeck({ latestPost, currentRole, skills }: Readonly<HeroHighlights>) {
  const t = useT();
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [order, setOrder] = useState<number[]>(INITIAL_ORDER);
  const [fanned, setFanned] = useState(false);
  const paused = useRef(false);

  const cards: Card[] = [
    {
      key: "photo",
      tone: "photo",
      body: (
        <Image
          src="/me.avif"
          alt={t("about.photoAlt", { name: t("common.siteName") })}
          fill
          preload
          sizes="(min-width: 768px) 340px, 82vw"
          className={styles["deck__photo"]}
        />
      ),
    },
    {
      key: "role",
      tone: "neutral",
      icon: <WorkOutlineIcon fontSize="small" />,
      label: t("hero.deck.currently"),
      body: (
        <>
          <p className={styles["deck__title"]}>{currentRole?.role ?? t("hero.deck.defaultRole")}</p>
          {currentRole?.company && <p className={styles["deck__meta"]}>{currentRole.company}</p>}
        </>
      ),
    },
    {
      key: "skills",
      tone: "warm",
      icon: <BoltIcon fontSize="small" />,
      label: t("hero.deck.topSkills"),
      body: (
        <ul className={styles["deck__chips"]}>
          {skills.slice(0, MAX_SKILL_CHIPS).map((skill) => (
            <li key={skill}>{skill}</li>
          ))}
        </ul>
      ),
    },
    {
      key: "post",
      tone: "brand",
      icon: <ArticleOutlinedIcon fontSize="small" />,
      label: t("hero.deck.latestBlog"),
      body: latestPost ? (
        <>
          <p className={styles["deck__title"]}>{latestPost.title}</p>
          {latestPost.relativeLabel && <p className={styles["deck__meta"]}>{latestPost.relativeLabel}</p>}
          <Link href={`/blogs/${latestPost.slug}`} className={styles["deck__link"]}>
            {t("hero.deck.readIt")} <span aria-hidden="true">→</span>
          </Link>
        </>
      ) : (
        <>
          <p className={styles["deck__title"]}>{t("hero.deck.blogFallback")}</p>
          <Link href="/blogs" className={styles["deck__link"]}>
            {t("hero.deck.browseBlog")} <span aria-hidden="true">→</span>
          </Link>
        </>
      ),
    },
  ];

  const place = useCallback(
    (nextOrder: number[], spread: boolean, duration = 0.8) => {
      const slots = spread ? FANNED : STACKED;
      nextOrder.forEach((cardIndex, position) => {
        const el = cardRefs.current[cardIndex];
        if (!el) {return;}
        el.style.zIndex = String(TOP_Z_INDEX - position);
        const { x, y, rotation, scale } = slots[position];
        animate(el, { x, y, rotate: rotation, scale }, { duration, ease: EASE_OUT_EXPO });
      });
    },
    [],
  );

  // Deal the cards in once, then keep them in their slots.
  useEffect(() => {
    if (!deckLayout()) {return;}
    if (!motionAllowed()) {
      place(INITIAL_ORDER, false, 0);
      return;
    }
    INITIAL_ORDER.forEach((cardIndex, position) => {
      const el = cardRefs.current[cardIndex];
      if (!el) {return;}
      el.style.zIndex = String(TOP_Z_INDEX - position);
      const { x, y, rotation, scale } = STACKED[position];
      animate(
        el,
        { opacity: [0, 1], x: [DEAL.fromX, x], y: [DEAL.fromY, y], rotate: [DEAL.fromRotation, rotation], scale: [scale, scale] },
        { duration: DEAL.duration, delay: DEAL.delay + (FANNED.length - 1 - position) * DEAL.stagger, ease: EASE_OUT_EXPO },
      );
    });
  }, [place]);

  // Send the front card to the back with a little flick.
  const cycle = useCallback(() => {
    setOrder((current) => {
      const [front, ...rest] = current;
      const next = [...rest, front];
      const el = cardRefs.current[front];
      if (el && motionAllowed()) {
        animate(el, { x: TOSS.x, y: TOSS.y, rotate: TOSS.rotation }, { duration: TOSS.duration, ease: "easeIn" }).then(() => place(next, false, RESHUFFLE_SECONDS));
      } else {
        place(next, false, 0);
      }
      return next;
    });
  }, [place]);

  const bringToFront = (cardIndex: number) => {
    setOrder((current) => {
      if (current[0] === cardIndex) {return current;}
      const next = [cardIndex, ...current.filter((i) => i !== cardIndex)];
      place(next, fanned, RESHUFFLE_SECONDS);
      return next;
    });
  };

  // Auto-rotate, paused while hovered/focused or for reduced motion.
  useEffect(() => {
    if (!motionAllowed() || !deckLayout()) {return;}
    const timer = window.setInterval(() => {
      if (!paused.current && document.visibilityState === "visible") {cycle();}
    }, CYCLE_MS);
    return () => window.clearInterval(timer);
  }, [cycle]);

  const setSpread = (spread: boolean) => {
    if (!deckLayout()) {return;}
    paused.current = spread;
    setFanned(spread);
    place(order, spread, RESHUFFLE_SECONDS);
  };

  return (
    <div
      className={styles.deck}
      onMouseEnter={() => setSpread(true)}
      onMouseLeave={() => setSpread(false)}
      onFocus={() => (paused.current = true)}
      onBlur={() => (paused.current = false)}
    >
      {cards.map((card, index) => (
        <div
          key={card.key}
          ref={(el) => {
            cardRefs.current[index] = el;
          }}
          className={clsx(styles["deck__card"], TONE_CLASS[card.tone], order[0] === index && styles["deck__card--front"])}
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a") || !deckLayout()) {return;}
            if (order[0] === index) {cycle();} else {bringToFront(index);}
          }}
        >
          {card.label && (
            <span className={styles["deck__label"]}>
              {card.icon}
              {card.label}
            </span>
          )}
          {card.body}
        </div>
      ))}
    </div>
  );
}
