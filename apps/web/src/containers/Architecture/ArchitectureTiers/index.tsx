import type { ArchitectureEdgeConfig, ArchitectureNodeConfig } from "@/features/portfolio";
import { CloudIcon, DnsIcon, LanguageIcon, StorageIcon, WidgetsIcon } from "@dival-sehgal/ui/icons";
import styles from "./styles.module.scss";
import { getT } from "@/i18n/server";

const ICONS = { frontend: LanguageIcon, backend: DnsIcon, external: CloudIcon, data: StorageIcon };
const TIER_LABEL = {
  client: "architecture.tier.client",
  compute: "architecture.tier.compute",
  data: "architecture.tier.data",
} as const;
type Tier = keyof typeof TIER_LABEL;

/** Tier from the node, or inferred from its row in the canvas layout. */
function tierOf(node: ArchitectureNodeConfig, rows: number[]): Tier {
  if (node.tier) {return node.tier;}
  const row = rows.indexOf(node.position.y);
  if (row <= 0) {return "client";}
  return row === 1 ? "compute" : "data";
}

interface ArchitectureTiersProps {
  nodes: ArchitectureNodeConfig[];
  edges: ArchitectureEdgeConfig[];
}

/**
 * Stacked, phone-friendly version of the architecture diagram: one layer per
 * tier, each component a card whose details expand on tap and which lists
 * what it talks to. Server-rendered HTML (indexable, no JS, no canvas).
 */
export default function ArchitectureTiers({ nodes, edges }: Readonly<ArchitectureTiersProps>) {
  const t = getT();
  const rows = [...new Set(nodes.map((node) => node.position.y))].sort((a, b) => a - b);
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const tiers = (Object.keys(TIER_LABEL) as Tier[])
    .map((tier) => ({ tier, members: nodes.filter((node) => tierOf(node, rows) === tier) }))
    .filter(({ members }) => members.length > 0);

  return (
    <ol className={styles.tiers} aria-label={t("architecture.tiersLabel")}>
      {tiers.map(({ tier, members }) => (
        <li key={tier} className={styles["tiers__layer"]}>
          <h3 className={styles["tiers__label"]}>{t(TIER_LABEL[tier])}</h3>
          <ul className={styles["tiers__nodes"]}>
            {members.map((node) => {
              const Icon = (node.type && ICONS[node.type]) || WidgetsIcon;
              const outgoing = edges.filter((edge) => edge.source === node.id && byId.has(edge.target));
              return (
                <li key={node.id} className={styles["tiers__node"]} data-type={node.type ?? "default"}>
                  <details>
                    <summary className={styles["tiers__summary"]}>
                      <Icon fontSize="small" />
                      <span>{node.data.label}</span>
                    </summary>
                    {node.data.description && <p className={styles["tiers__copy"]}>{node.data.description}</p>}
                    {outgoing.length > 0 && (
                      <ul className={styles["tiers__links"]}>
                        {outgoing.map((edge) => (
                          <li key={edge.id}>
                            <span aria-hidden="true">→</span> {byId.get(edge.target)?.data.label}
                            {edge.label && <span className={styles["tiers__via"]}> ({edge.label})</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </details>
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ol>
  );
}
