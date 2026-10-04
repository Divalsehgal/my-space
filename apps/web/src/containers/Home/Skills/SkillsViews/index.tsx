"use client";

import { useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import clsx from "clsx";
import type { SphereGroup, SphereSkill } from "@/components/SkillSphere";
import styles from "./styles.module.scss";
import { useT } from "@/i18n/client";

// The sphere is client-only and decorative; the cards carry the content.
const SkillSphere = dynamic(() => import("@/components/SkillSphere"), { ssr: false });

type View = "sphere" | "cards";

interface SkillsViewsProps {
  skills: SphereSkill[];
  groups: SphereGroup[];
  /** The skill cards (server-rendered); always in the DOM for SEO and screen readers. */
  children: ReactNode;
}

export default function SkillsViews({ skills, groups, children }: Readonly<SkillsViewsProps>) {
  const t = useT();
  const [view, setView] = useState<View>("sphere");

  // Phones open on the cards; the sphere needs room to be readable.
  useEffect(() => {
    if (typeof window.matchMedia === "function" && !window.matchMedia("(min-width: 768px)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setView("cards");
    }
  }, []);

  return (
    <div className={styles.views}>
      <div className={styles["views__toggle"]} role="group" aria-label={t("skills.viewToggle")}>
        {(["sphere", "cards"] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={view === option}
            className={clsx(styles["views__option"], view === option && styles["views__option--active"])}
            onClick={() => setView(option)}
          >
            {t(option === "sphere" ? "skills.viewSphere" : "skills.viewCards")}
          </button>
        ))}
      </div>

      {view === "sphere" && <SkillSphere skills={skills} groups={groups} />}
      {/* Visually hidden (not `hidden`) in sphere view so screen readers always get the cards. */}
      <div className={clsx(view !== "cards" && styles["views__sr"])}>{children}</div>
    </div>
  );
}
