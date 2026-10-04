"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { animate, scroll } from "framer-motion";
import { motionAllowed } from "@/lib/motion";

/** How far (percent of its height) and how faded the hero copy is once scrolled out. */
const LIFT_PERCENT = 18;
const SCROLLED_OUT_OPACITY = 0.15;

interface HeroStageProps {
  children: ReactNode;
  className?: string;
}

/**
 * Lifts the hero copy away as the hero scrolls out (scrubbed to scroll).
 * The load-in intro is pure CSS (see Hero/styles.module.scss) so it never
 * waits on this JavaScript.
 */
export default function HeroStage({ children, className }: Readonly<HeroStageProps>) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || !motionAllowed()) {return;}
    const section = el.closest("section") ?? el;
    return scroll(
      animate(el, { transform: ["translateY(0%)", `translateY(-${LIFT_PERCENT}%)`], opacity: [1, SCROLLED_OUT_OPACITY] }, { ease: "linear" }),
      { target: section, offset: ["start start", "end start"] },
    );
  }, []);

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}
