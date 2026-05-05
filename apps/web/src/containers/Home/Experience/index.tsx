"use client";

import clsx from "clsx";
import Carousel from "@/components/Carousel";
import styles from "./styles.module.scss";
import ExperienceCard from "@/components/ExperienceCard";
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import FluidContainer from "@/components/FluidContainer";
import SectionHeader from "@/components/SectionHeader";
import { usePortfolioContext } from "@/context/PortfolioContext";

export default function ExperienceSection() {
  const config = usePortfolioContext();
  const items = config?.experience || [];

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
      <Carousel
        items={items}
        progressLabelPrefix="Role"
        renderItem={(item) => <ExperienceCard experience={item} />}
      />
    </FluidContainer>
  );
}
