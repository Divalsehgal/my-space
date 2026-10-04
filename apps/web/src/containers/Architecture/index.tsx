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
}

/** The system map: stacked tiers on phones, the interactive diagram from tablet up. */
export default function Architecture({ data, headingLevel: Heading = "h2", titleId }: Readonly<ArchitectureProps>) {
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
      </header>

      <ArchitectureTiers nodes={data.nodes} edges={data.edges} />
      <LazyArchitectureDiagram nodes={data.nodes} edges={data.edges} />
    </div>
  );
}
