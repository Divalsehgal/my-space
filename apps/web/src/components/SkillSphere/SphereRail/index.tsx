import clsx from "clsx";
import { useT } from "@/i18n/client";
import type { SphereGroup } from "../types";
import styles from "./styles.module.scss";

interface SphereRailProps {
  groups: SphereGroup[];
  counts: number[];
  total: number;
  colors: string[];
  focus: number | null;
  onAll: () => void;
  /** A category button was pressed (it toggles off when already focused). */
  onCategory: (group: number) => void;
}

/** "All" plus one button per category, each with its skill count. */
export default function SphereRail({ groups, counts, total, colors, focus, onAll, onCategory }: Readonly<SphereRailProps>) {
  const t = useT();
  return (
    <fieldset className={styles.rail} aria-label={t("skills.categories")}>
      <button
        type="button"
        className={clsx(styles["rail__cat"], focus === null && styles["rail__cat--active"])}
        aria-pressed={focus === null}
        onClick={onAll}
      >
        <span>{t("skills.all")}</span>
        <span className={styles["rail__count"]}>{total}</span>
      </button>
      {groups.map((group, index) => (
        <button
          key={group.key}
          type="button"
          className={clsx(styles["rail__cat"], focus === index && styles["rail__cat--active"])}
          style={{ "--c": colors[index % colors.length] } as React.CSSProperties}
          aria-pressed={focus === index}
          onClick={() => onCategory(index)}
        >
          <span className={styles["rail__dot"]} aria-hidden="true" />
          <span>{group.label}</span>
          <span className={styles["rail__count"]}>{counts[index]}</span>
        </button>
      ))}
    </fieldset>
  );
}
