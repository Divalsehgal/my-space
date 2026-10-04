import Link from "next/link";
import { getT } from "@/i18n/server";
import { trackAttrs, ANALYTICS_EVENTS } from "@/utils/analytics";
import styles from "./styles.module.scss";

// A tiny client → servers → data map; pulses travel down the edges.
const NODES = {
  client: { x: 32, y: 8, r: 5 },
  web: { x: 14, y: 30, r: 4 },
  worker: { x: 50, y: 30, r: 4 },
  cms: { x: 8, y: 52, r: 4 },
  cache: { x: 32, y: 52, r: 4 },
  ai: { x: 56, y: 52, r: 4 },
};
type NodeId = keyof typeof NODES;
const EDGES: [NodeId, NodeId][] = [
  ["client", "web"],
  ["client", "worker"],
  ["web", "cms"],
  ["web", "cache"],
  ["worker", "cache"],
  ["worker", "ai"],
];

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
      <svg className={styles["widget__map"]} viewBox="0 0 64 60" aria-hidden="true">
        {EDGES.map(([from, to], index) => {
          const d = `M${NODES[from].x} ${NODES[from].y} L${NODES[to].x} ${NODES[to].y}`;
          return (
            <g key={d}>
              <path d={d} className={styles["widget__edge"]} />
              <path d={d} className={styles["widget__pulse"]} style={{ "--i": index } as React.CSSProperties} pathLength={1} />
            </g>
          );
        })}
        {Object.entries(NODES).map(([id, { x, y, r }]) => (
          <circle key={id} cx={x} cy={y} r={r} className={styles["widget__node"]} />
        ))}
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
