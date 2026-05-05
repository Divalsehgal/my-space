"use client";

import Carousel from "@/components/Carousel";
import ProjectCard from "@/components/ProjectCard";
import clsx from "clsx";
import styles from "./styles.module.scss";
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import FluidContainer from "@/components/FluidContainer";
import SectionHeader from "@/components/SectionHeader";
import { usePortfolioContext } from "@/context/PortfolioContext";

export default function Project() {
  const config = usePortfolioContext();
  const items = config?.projects || [];

  return (
    <FluidContainer as="section" id="projects" className={clsx("section", styles.project)}>
      <SectionHeader 
        title="Projects" 
        align="left" 
        action={{
          label: "View All",
          href: "/projects",
          icon: <ArrowOutwardIcon />
        }}
      />
      <Carousel
        items={items}
        progressLabelPrefix="Project"
        renderItem={(item) => <ProjectCard project={item} />}
      />
    </FluidContainer>
  );
}
