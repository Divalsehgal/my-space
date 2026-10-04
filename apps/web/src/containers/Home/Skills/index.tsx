import clsx from "clsx";
import styles from "./styles.module.scss";
import FluidContainer from "@/components/FluidContainer";
import SectionHeader from "@/components/SectionHeader";
import { DEPTH_LABEL, SKILL_DEPTHS, skillDepth, type SkillDepth, type SkillsConfig, type SkillItemConfig } from "@/features/portfolio";
import type { SphereGroup, SphereSkill } from "@/components/SkillSphere";
import SkillsViews from "./SkillsViews";
import { humanizeSkillKey } from "@/utils/humanizeSkillKey";
import { getT } from "@/i18n/server";
import type { Translate } from "@/i18n/core";

interface SkillsProps {
  categories?: SkillsConfig;
}

/** Signal-strength style meter: 1-4 bars for depth of experience. */
function DepthMeter({ depth }: Readonly<{ depth: SkillDepth }>) {
  return (
    <span className={styles["skills__meter"]} aria-hidden="true">
      {SKILL_DEPTHS.map((bar) => (
        <span key={bar} className={clsx(styles["skills__bar"], bar <= depth && styles["skills__bar--on"])} />
      ))}
    </span>
  );
}

function SkillTags({ items, t }: Readonly<{ items: SkillItemConfig[]; t: Translate }>) {
  return (
    <ul className={styles["skills__tags"]}>
      {items.map((item) => {
        const depth = skillDepth(item.level);
        return (
          <li key={item.name} className={styles["skills__tag"]} title={t(DEPTH_LABEL[depth])}>
            <span>{item.name}</span>
            <DepthMeter depth={depth} />
            <span className={styles["skills__sr"]}>, {t(DEPTH_LABEL[depth])}</span>
          </li>
        );
      })}
    </ul>
  );
}

function toSphere(entries: [string, SkillItemConfig[] | Record<string, SkillItemConfig[]>][]) {
  const groups: SphereGroup[] = entries.map(([key]) => ({ key, label: humanizeSkillKey(key) }));
  const seen = new Set<string>();
  const skills: SphereSkill[] = [];
  entries.forEach(([, value], group) => {
    const subgroups: [string | undefined, SkillItemConfig[]][] = Array.isArray(value)
      ? [[undefined, value]]
      : Object.entries(value).map(([subKey, items]) => [humanizeSkillKey(subKey), items]);
    subgroups.forEach(([sub, items]) =>
      items.forEach((item) => {
        if (seen.has(item.name)) {return;}
        seen.add(item.name);
        skills.push({ name: item.name, group, depth: skillDepth(item.level), sub });
      }),
    );
  });
  return { groups, skills };
}

export default function Skills({ categories = {} }: SkillsProps) {
  const t = getT();
  // Object.entries preserves the source config's key order, which is what
  // the categories should render in — not alphabetical or otherwise resorted.
  // Empty groups/sub-groups (e.g. a not-yet-populated "azure": []) are skipped.
  const categoryEntries = Object.entries(categories)
    .map(([key, value]): [string, SkillItemConfig[] | Record<string, SkillItemConfig[]>] =>
      Array.isArray(value)
        ? [key, value]
        : [key, Object.fromEntries(Object.entries(value).filter(([, items]) => items.length > 0))],
    )
    .filter(([, value]) => (Array.isArray(value) ? value.length > 0 : Object.keys(value).length > 0));
  const hasCategories = categoryEntries.length > 0;

  if (!hasCategories) {
    return null;
  }

  return (
    <FluidContainer as="section" id="skills" className={clsx("section", styles.skills)}>
      <SectionHeader
        title={t("skills.title")}
        subtitle={t("skills.subtitle")}
        align="left"
      />

      <SkillsViews {...toSphere(categoryEntries)}>

      <div className={styles["skills__groups"]} data-spotlight-group>
        {categoryEntries.map(([key, value]) => (
          <div
            key={key}
            data-spotlight
            data-reveal
            className={styles["skills__group"]}
          >
            <p className={styles["skills__group-title"]}>{humanizeSkillKey(key)}</p>

            {Array.isArray(value) ? (
              <SkillTags items={value} t={t} />
            ) : (
              <div className={styles["skills__subgroups"]}>
                {Object.entries(value).map(([subKey, items]) => (
                  <div key={subKey} className={styles["skills__subgroup"]}>
                    <p className={styles["skills__subgroup-title"]}>{humanizeSkillKey(subKey)}</p>
                    <SkillTags items={items} t={t} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      </SkillsViews>
    </FluidContainer>
  );
}
