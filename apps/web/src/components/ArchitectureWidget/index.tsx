import Link from "next/link";
import { getT } from "@/i18n/server";
import { trackAttrs, ANALYTICS_EVENTS } from "@/utils/analytics";
import architecture from "@/generated/architecture.json";
import styles from "./styles.module.scss";

// Thumbnail of the generated diagram: one row of dots per layer (shell at the top,
// services at the bottom), so it changes when the architecture does.
const MAX_DOTS = 5;
const ROW_GAP = 12;
const DOT_GAP = 12;
const layerIds = architecture.layers.map((layer) => layer.id);
const CENTER_X = 32;
const TOP_Y = 6;
const ROWS = layerIds.map((id, row) => {
  const count = Math.min(architecture.nodes.filter((node) => node.tier === id).length, MAX_DOTS);
  return Array.from({ length: count }, (_, index) => ({ x: CENTER_X + (index - (count - 1) / 2) * DOT_GAP, y: TOP_Y + row * ROW_GAP }));
});
// Each dot links to the dot at the same relative position in the row below.
const EDGES = ROWS.slice(1).flatMap((row, i) => {
  const above = ROWS[i];
  return above.length ? row.map((to, index) => [above[Math.round((index * (above.length - 1)) / Math.max(row.length - 1, 1))], to] as const) : [];
});

/**
 * Top-right card on the home page: a live-looking thumbnail of the system map.
 * Opens /architecture, which the @modal slot shows as a modal over the page.
 */
export default function ArchitectureWidget() {
  const t = getT();
  return (
    <Link
      href="/architecture"
      scroll={false}
      className={styles.widget}
      {...trackAttrs(ANALYTICS_EVENTS.NAV_CLICK, { label: "Architecture", href: "/architecture", location: "architecture-widget" })}
    >
      <svg className={styles["widget__map"]} viewBox="0 0 64 60" aria-hidden="true" data-layers={layerIds.length}>
        {EDGES.map(([from, to], index) => {
          const d = `M${from.x} ${from.y} L${to.x} ${to.y}`;
          return (
            <g key={d}>
              <path d={d} className={styles["widget__edge"]} />
              <path d={d} className={styles["widget__pulse"]} style={{ "--i": index } as React.CSSProperties} pathLength={1} />
            </g>
          );
        })}
        {ROWS.flatMap((row) => row.map(({ x, y }) => <circle key={`${x}-${y}`} cx={x} cy={y} r={3} className={styles["widget__node"]} />))}
      </svg>
      <span className={styles["widget__copy"]}>
        <span className={styles["widget__eyebrow"]}>{t("architecture.title")}</span>
        <span className={styles["widget__title"]}>{t("architecture.subtitle")}</span>
      </span>
      <span className={styles["widget__arrow"]} aria-hidden="true">
        {"↗"}
      </span>
    </Link>
  );
}
