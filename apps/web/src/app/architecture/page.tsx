import type { Metadata } from "next";
import Architecture from "@/containers/Architecture";
import { getArchitecture } from "@/containers/Architecture/data";
import Breadcrumbs from "@/components/Breadcrumbs";
import FluidContainer from "@/components/FluidContainer";
import { getT } from "@/i18n/server";
import styles from "./styles.module.scss";

export function generateMetadata(): Metadata {
  const t = getT();
  return {
    title: t("architecture.title"),
    description: t("architecture.subtitle"),
    alternates: { canonical: "/architecture" },
  };
}

/** Direct visits and refreshes land here; in-app clicks open the same view as a modal. */
export default async function ArchitecturePage() {
  const t = getT();
  const data = await getArchitecture();
  return (
    <div className={`page-scroll ${styles.page}`}>
      <Breadcrumbs items={[{ label: t("nav.architecture"), href: "/architecture" }]} />
      <FluidContainer as="section" className={styles["page__body"]}>
        <Architecture data={data} headingLevel="h1" />
      </FluidContainer>
    </div>
  );
}
