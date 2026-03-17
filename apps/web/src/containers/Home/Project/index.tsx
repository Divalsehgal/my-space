"use client";

import Carousel from "@/components/Carousel";
import ProjectCard from "@/components/ProjectCard";
import styles from "./styles.module.scss";
import { type ProjectConfig } from "@/features/portfolio";
import FluidContainer from "@/components/FluidContainer";
import SectionHeader from "@/components/SectionHeader";

type Props = {
  readonly items: readonly ProjectConfig[];
};

export default function Project({ items }: Readonly<Props>) {
  return (
    <FluidContainer as="section" id="projects" className="section">
      <SectionHeader title="Projects" align="left" />
      <Carousel
        items={items || []}
        progressLabelPrefix="Project"
        renderItem={(item) => <ProjectCard project={item} />}
      />
    </FluidContainer>
  );
}
