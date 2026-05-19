import clsx from "clsx";
import styles from "./styles.module.scss";
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import FluidContainer from "@/components/FluidContainer";
import SectionHeader from "@/components/SectionHeader";
import { type ExperienceConfig } from "@/features/portfolio";
import ExperienceCarousel from "./ExperienceCarousel";

interface ExperienceProps {
  items?: ExperienceConfig[];
}

export default function ExperienceSection({ items = [] }: ExperienceProps) {
  return (
    <FluidContainer
      as="section"
      id="experience"
      className={clsx("section", styles.experience)}
    >
      <SectionHeader 
        title="Experience" 
        align="left" 
        action={{
          label: "Full Career",
          href: "/experience",
          icon: <ArrowOutwardIcon />
        }}
      />
      <ExperienceCarousel items={items} />
    </FluidContainer>
  );
}
