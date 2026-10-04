import clsx from "clsx";
import styles from "./styles.module.scss";
import { ArrowOutwardIcon } from "@dival-sehgal/ui/icons";
import FluidContainer from "@/components/FluidContainer";
import SectionHeader from "@/components/SectionHeader";
import { type ProjectConfig } from "@/features/portfolio";
import ProjectCarousel from "./ProjectCarousel";
import { getT } from "@/i18n/server";

interface ProjectProps {
  items?: ProjectConfig[];
}

export default function Project({ items = [] }: Readonly<ProjectProps>) {
  const t = getT();
  return (
    <FluidContainer as="section" id="projects" className={clsx("section", styles.project)}>
      <SectionHeader 
        title={t("projects.title")} 
        align="left" 
        action={{
          label: t("projects.viewAll"),
          href: "/projects",
          icon: <ArrowOutwardIcon />
        }}
      />
      <ProjectCarousel items={items} />
    </FluidContainer>
  );
}
