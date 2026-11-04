import type { Metadata } from "next";
import Architecture from "@/containers/Architecture";
import { CHATBOT_LLD, CHATBOT_LLD_HREF, getArchitecture } from "@/containers/Architecture/data";
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
    // Thin auto-generated page; keep it out of the index so it doesn't drag down site quality.
    robots: { index: false, follow: true },
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
        <Architecture data={data} headingLevel="h1" related={CHATBOT_LLD.nodes.length ? { href: CHATBOT_LLD_HREF, label: CHATBOT_LLD.title ?? "Chatbot LLD" } : undefined} />
      </FluidContainer>
    </div>
  );
}
