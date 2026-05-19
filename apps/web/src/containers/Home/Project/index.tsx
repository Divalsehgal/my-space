import clsx from "clsx";
import styles from "./styles.module.scss";
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import FluidContainer from "@/components/FluidContainer";
import SectionHeader from "@/components/SectionHeader";
import { type ProjectConfig } from "@/features/portfolio";
import ProjectCarousel from "./ProjectCarousel";

interface ProjectProps {
  items?: ProjectConfig[];
}

export default function Project({ items = [] }: ProjectProps) {
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
      <ProjectCarousel items={items} />
    </FluidContainer>
  );
}
