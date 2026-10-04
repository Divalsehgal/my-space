"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motionAllowed } from "@/lib/motion";
import { useThemeContext } from "@/context/ThemeContext";
import { CATEGORICAL_PALETTE } from "@/lib/theme/palette";
import { fibonacciSphere } from "@dival-sehgal/utils/math";
import SpherePanel from "./SpherePanel";
import SphereRail from "./SphereRail";
import { IDLE_SPEED, SPHERE } from "./constants";
import type { SphereGroup, SphereSkill } from "./types";
import { useSphereDrag, type SphereMotion } from "./useSphereDrag";
import { stepMotion } from "./motion";
import { drawSphere } from "./draw";
import styles from "./styles.module.scss";
import { useT } from "@/i18n/client";
import { MAX_SKILL_DEPTH } from "@/features/portfolio/skillLevel";

export type { SphereGroup, SphereSkill };

const BACK_CLASS = styles["sphere__item--back"];
// Literal class names so PurgeCSS keeps them.
const DEPTH_CLASS = {
  1: styles["sphere__item--d1"],
  2: styles["sphere__item--d2"],
  3: styles["sphere__item--d3"],
  4: styles["sphere__item--d4"],
};

interface SkillSphereProps {
  skills: SphereSkill[];
  groups: SphereGroup[];
}

/**
 * Every skill on a turning sphere: bigger = deeper experience, colour =
 * category. Categories sit in a rail on the left, an info panel on the right
 * explains whatever is selected. Clicking a word spins it to the front. CSS 3D
 * only (no WebGL); stops animating off-screen or for reduced-motion users.
 */
export default function SkillSphere({ skills, groups }: Readonly<SkillSphereProps>) {
  const t = useT();
  const stage = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  const paint = useRef<(() => void) | null>(null);
  const state = useRef<SphereMotion>({
    rotX: -0.25, rotY: 0, velX: 0, velY: IDLE_SPEED, dragging: false, moved: false,
    lastX: 0, lastY: 0, hovering: false, target: null,
  });
  const [focus, setFocus] = useState<number | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const colors = CATEGORICAL_PALETTE[useThemeContext().mode];

  // Even spread over the sphere; deepest skills placed first so they never cluster.
  const points = useMemo(() => {
    const ordered = [...skills].sort((a, b) => b.depth - a.depth);
    const positions = fibonacciSphere(ordered.length);
    return ordered.map((skill, i) => ({ ...skill, ...positions[i] }));
  }, [skills]);

  const counts = useMemo(() => groups.map((_, g) => skills.filter((s) => s.group === g).length), [groups, skills]);
  const active = points.find((p) => p.name === (hovered ?? selected)) ?? null;

  useEffect(() => {
    const el = stage.current;
    if (!el) {return;}
    const animate = motionAllowed();
    let frame = 0;
    let visible = true;

    // Only write z-index and the back class when they change: rewriting them
    // for every word on every frame forces needless style recalculation.
    const lastZ: number[] = [];
    let radius = el.clientWidth * SPHERE.radiusRatio;
    // The stage, not the window: switching views or layouts resizes it too.
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => {
      radius = el.clientWidth * SPHERE.radiusRatio;
      paint.current?.();
    });
    resize?.observe(el);
    let lastTime = performance.now();

    const scene = { points, nodes: items.current, lastZ, backClass: BACK_CLASS };
    const draw = () => drawSphere(state.current, scene, radius);

    const render = (now: number) => {
      stepMotion(state.current, animate, now - lastTime);
      lastTime = now;
      draw();
      if (visible) {frame = requestAnimationFrame(render);}
    };

    // Redraw now without moving (React commits, selections). Without motion
    // there's no loop, so this is also where a selection snaps into place.
    paint.current = () => {
      if (!animate) {stepMotion(state.current, false, 0);}
      draw();
    };
    const stop = () => {
      resize?.disconnect();
      cancelAnimationFrame(frame);
    };
    if (!animate) {
      paint.current();
      return stop;
    }
    frame = requestAnimationFrame(render);
    if (typeof IntersectionObserver === "undefined") {return stop;}
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(frame);
      if (visible) {
        lastTime = performance.now(); // resume without a catch-up jump
        frame = requestAnimationFrame(render);
      }
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      stop();
    };
  }, [points]);

  // React re-renders reset className, dropping the imperative back-dot class;
  // re-project after every commit (the animated loop also covers this).
  useLayoutEffect(() => {
    paint.current?.();
  });

  // Turn the sphere so a direction (a skill, or a category's centre) faces the viewer.
  const faceTowards = (p: { x: number; y: number; z: number } | null) => {
    state.current.target = p ? { y: Math.atan2(-p.x, p.z), x: Math.atan2(p.y, Math.hypot(p.x, p.z)) } : null;
    paint.current?.();
  };

  const select = (name: string | null) => {
    setSelected(name);
    faceTowards(points.find((point) => point.name === name) ?? null);
  };

  const focusGroup = (group: number | null) => {
    setFocus(group);
    const members = points.filter((p) => p.group === group);
    if (!members.length) {
      faceTowards(null);
      return;
    }
    const sum = members.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y, z: acc.z + p.z }), { x: 0, y: 0, z: 0 });
    faceTowards(sum);
  };

  const { onPointerDown, onPointerMove, endDrag } = useSphereDrag(state);

  const focusedSkills = focus === null ? [] : [...skills].filter((s) => s.group === focus).sort((a, b) => b.depth - a.depth);
  const deep = skills.filter((s) => s.depth === MAX_SKILL_DEPTH).length;
  const strongest = groups[counts.indexOf(Math.max(...counts))]?.label;

  return (
    <div className={styles.sphere}>
      <SphereRail
        groups={groups}
        counts={counts}
        total={skills.length}
        colors={colors}
        focus={focus}
        onAll={() => focusGroup(null)}
        onCategory={(index) => {
          setSelected(null);
          focusGroup(focus === index ? null : index);
        }}
      />

      {/* Decorative: the skill cards (SkillsViews) carry the accessible content. */}
      <div className={styles["sphere__center"]} aria-hidden="true">
        <div
          ref={stage}
          className={styles["sphere__stage"]}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={endDrag}
        >
          <ul className={styles["sphere__list"]}>
            {points.map((p, i) => (
              <li
                key={p.name}
                ref={(node) => {
                  items.current[i] = node;
                }}
                // Constant className: the frame loop owns the back-dot class
                // here, and React must never rewrite it.
                className={clsx(styles["sphere__item"], DEPTH_CLASS[p.depth])}
                style={{ "--c": colors[p.group % colors.length] } as React.CSSProperties}
                onPointerEnter={() => {
                  state.current.hovering = true;
                  setHovered(p.name);
                }}
                onPointerLeave={() => {
                  state.current.hovering = false;
                  setHovered(null);
                }}
                onClick={() => {
                  if (!state.current.moved) {select(selected === p.name ? null : p.name);}
                }}
              >
                <span
                  className={clsx(styles["sphere__dot"], focus !== null && focus !== p.group && styles["sphere__dot--dim"])}
                  aria-hidden="true"
                />
                <span
                  className={clsx(
                    styles["sphere__word"],
                    focus !== null && focus !== p.group && styles["sphere__word--dim"],
                    (hovered === p.name || selected === p.name) && styles["sphere__word--hover"],
                  )}
                >
                  {p.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className={styles["sphere__hint"]}>{t("skills.hint")}</p>
      </div>

      <aside className={styles["sphere__panel"]} aria-live="polite">
        <SpherePanel
          active={active}
          selected={selected}
          focus={focus}
          groups={groups}
          colors={colors}
          focusedSkills={focusedSkills}
          totals={{ skills: skills.length, deep, categories: groups.length, strongest }}
          onSelect={select}
        />
      </aside>
    </div>
  );
}
