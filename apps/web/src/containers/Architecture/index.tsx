import Link from "next/link";
import LazyArchitectureDiagram from "./LazyArchitectureDiagram";
import ArchitectureTiers from "./ArchitectureTiers";
import { type ArchitectureConfig } from "@/features/portfolio";
import { getT } from "@/i18n/server";
import styles from "./styles.module.scss";

interface ArchitectureProps {
  data?: ArchitectureConfig;
  /** h1 on its own page, h2 inside the modal over another page. */
  headingLevel?: "h1" | "h2";
  /** For the modal's aria-labelledby. */
  titleId?: string;
  /** A related diagram (HLD ↔ chatbot LLD), shown as a button in the header. */
  related?: { href: string; label: string };
}

/** The system map: stacked tiers on phones, the interactive diagram from tablet up. */
export default function Architecture({ data, headingLevel: Heading = "h2", titleId, related }: Readonly<ArchitectureProps>) {
  const t = getT();
  if (!data?.nodes?.length) {
    return null;
  }

  return (
    <div className={styles.architecture}>
      <header className={styles["architecture__header"]}>
        <Heading id={titleId} className={styles["architecture__title"]}>
          {data.title ?? t("architecture.title")}
        </Heading>
        <p className={styles["architecture__subtitle"]}>{data.subtitle ?? t("architecture.subtitle")}</p>
        {related && (
          // scroll={false}: inside the modal this swaps the diagram in place.
          <Link href={related.href} scroll={false} className={styles["architecture__related"]}>
            {related.label}
            <span aria-hidden="true">{" ↗"}</span>
          </Link>
        )}
      </header>

      <ArchitectureTiers nodes={data.nodes} edges={data.edges} />
      <LazyArchitectureDiagram nodes={data.nodes} edges={data.edges} />
    </div>
  );
}
