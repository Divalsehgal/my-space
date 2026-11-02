import type { Metadata } from "next";
import Architecture from "@/containers/Architecture";
import { CHATBOT_LLD, CHATBOT_LLD_HREF } from "@/containers/Architecture/data";
import Breadcrumbs from "@/components/Breadcrumbs";
import FluidContainer from "@/components/FluidContainer";
import { getT } from "@/i18n/server";
import styles from "./styles.module.scss";

export function generateMetadata(): Metadata {
  return {
    title: CHATBOT_LLD.title,
    description: CHATBOT_LLD.subtitle,
    alternates: { canonical: CHATBOT_LLD_HREF },
  };
}

/** The chatbot's low-level design; in-app clicks open it as a modal, like /architecture. */
export default function ChatbotLldPage() {
  const t = getT();
  return (
    <div className={`page-scroll ${styles.page}`}>
      <Breadcrumbs
        items={[
          { label: t("nav.architecture"), href: "/architecture" },
          { label: CHATBOT_LLD.title ?? "Chatbot LLD", href: CHATBOT_LLD_HREF },
        ]}
      />
      <FluidContainer as="section" className={styles["page__body"]}>
        <Architecture data={CHATBOT_LLD} headingLevel="h1" related={{ href: "/architecture", label: t("architecture.title") }} />
      </FluidContainer>
    </div>
  );
}
