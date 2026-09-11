import clsx from "clsx";
import styles from "./styles.module.scss";
import FluidContainer from "@/components/FluidContainer";
import SectionHeader from "@/components/SectionHeader";
import { type SkillsConfig, type SkillItemConfig } from "@/features/portfolio";
import { humanizeSkillKey } from "@/utils/humanizeSkillKey";

interface SkillsProps {
  categories?: SkillsConfig;
}

const LEVEL_FILL_CLASSES: Record<string, string> = {
  expert: styles["skills__tag--expert"],
  advanced: styles["skills__tag--advanced"],
  intermediate: styles["skills__tag--intermediate"],
  beginner: styles["skills__tag--beginner"],
};

function SkillTags({ items }: Readonly<{ items: SkillItemConfig[] }>) {
  return (
    <div className={styles["skills__tags"]}>
      {items.map((item) => {
        const fillClass = LEVEL_FILL_CLASSES[item.level?.toLowerCase() ?? ""];
        return (
          <div key={item.name} className={clsx(styles["skills__tag"], fillClass)} title={item.level}>
            <span>{item.name}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Skills({ categories = {} }: SkillsProps) {
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
        title="Skills"
        subtitle="Technologies and tools I use to build things end to end."
        align="left"
      />

      <div className={styles["skills__groups"]}>
        {categoryEntries.map(([key, value]) => (
          <div key={key} className={styles["skills__group"]}>
            <p className={styles["skills__group-title"]}>{humanizeSkillKey(key)}</p>

            {Array.isArray(value) ? (
              <SkillTags items={value} />
            ) : (
              <div className={styles["skills__subgroups"]}>
                {Object.entries(value).map(([subKey, items]) => (
                  <div key={subKey} className={styles["skills__subgroup"]}>
                    <p className={styles["skills__subgroup-title"]}>{humanizeSkillKey(subKey)}</p>
                    <SkillTags items={items} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </FluidContainer>
  );
}
