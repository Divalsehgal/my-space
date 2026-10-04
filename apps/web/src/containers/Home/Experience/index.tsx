import clsx from "clsx";
import styles from "./styles.module.scss";
import { ArrowOutwardIcon } from "@dival-sehgal/ui/icons";
import FluidContainer from "@/components/FluidContainer";
import SectionHeader from "@/components/SectionHeader";
import { type ExperienceConfig } from "@/features/portfolio";
import ExperienceCarousel from "./ExperienceCarousel";
import { getT } from "@/i18n/server";

interface ExperienceProps {
  items?: ExperienceConfig[];
}

export default function ExperienceSection({ items = [] }: Readonly<ExperienceProps>) {
  const t = getT();
  return (
    <FluidContainer
      as="section"
      id="experience"
      className={clsx("section", styles.experience)}
    >
      <SectionHeader 
        title={t("experience.title")} 
        align="left" 
        action={{
          label: t("experience.fullCareer"),
          href: "/experience",
          icon: <ArrowOutwardIcon />
        }}
      />
      <ExperienceCarousel items={items} />
    </FluidContainer>
  );
}
