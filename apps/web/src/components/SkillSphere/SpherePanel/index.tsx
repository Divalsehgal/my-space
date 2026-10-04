import { DEPTH_LABEL, SKILL_DEPTHS, type SkillDepth } from "@/features/portfolio/skillLevel";
import { useT } from "@/i18n/client";
import clsx from "clsx";
import type { Point, SphereGroup, SphereSkill } from "../types";
import styles from "./styles.module.scss";

function Meter({ depth }: Readonly<{ depth: SkillDepth }>) {
  return (
    <span className={styles["panel__meter"]} aria-hidden="true">
      {SKILL_DEPTHS.map((bar) => (
        <span key={bar} className={clsx(styles["panel__bar"], bar <= depth && styles["panel__bar--on"])} />
      ))}
    </span>
  );
}

interface SpherePanelProps {
  active: Point | null;
  selected: string | null;
  focus: number | null;
  groups: SphereGroup[];
  colors: string[];
  focusedSkills: SphereSkill[];
  totals: { skills: number; deep: number; categories: number; strongest?: string };
  onSelect: (name: string | null) => void;
}

/** Explains whatever is selected: a skill, a category, or the whole stack. */
export default function SpherePanel({ active, selected, focus, groups, colors, focusedSkills, totals, onSelect }: Readonly<SpherePanelProps>) {
  const t = useT();
  // Split around the placeholder so the area name can be bold in any word order.
  const [broadestBefore, broadestAfter = ""] = t("skills.broadestArea").split("{area}");
  if (active) {
    return (
      <>
        <p className={styles["panel__eyebrow"]} style={{ color: colors[active.group % colors.length] }}>
          {groups[active.group]?.label}
          {active.sub ? ` · ${active.sub}` : ""}
        </p>
        <h3 className={styles["panel__name"]}>{active.name}</h3>
        <p className={styles["panel__depth"]}>
          <Meter depth={active.depth} />
          {t(DEPTH_LABEL[active.depth])}
        </p>
        {selected && (
          <button type="button" className={styles["panel__clear"]} onClick={() => onSelect(null)}>
            {t("skills.clearSelection")}
          </button>
        )}
      </>
    );
  }
  if (focus !== null) {
    return (
      <>
        <h3 className={styles["panel__name"]}>{groups[focus]?.label}</h3>
        <ul className={styles["panel__ranked"]}>
          {focusedSkills.map((skill) => (
            <li key={skill.name}>
              <button type="button" onClick={() => onSelect(skill.name)}>
                <span>{skill.name}</span>
                <Meter depth={skill.depth} />
                <span className={styles["panel__sr"]}>, {t(DEPTH_LABEL[skill.depth])}</span>
              </button>
            </li>
          ))}
        </ul>
      </>
    );
  }
  return (
    <>
      <h3 className={styles["panel__name"]}>{t("skills.atAGlance")}</h3>
      <dl className={styles["panel__stats"]}>
        <div><dt>{t("skills.statSkills")}</dt><dd>{totals.skills}</dd></div>
        <div><dt>{t("skills.statDeep")}</dt><dd>{totals.deep}</dd></div>
        <div><dt>{t("skills.statCategories")}</dt><dd>{totals.categories}</dd></div>
      </dl>
      {totals.strongest && (
        <p className={styles["panel__note"]}>
          {broadestBefore}
          <strong>{totals.strongest}</strong>
          {broadestAfter}
        </p>
      )}
    </>
  );
}

