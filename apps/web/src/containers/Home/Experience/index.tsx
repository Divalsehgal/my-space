"use client";

import Carousel from "@/components/Carousel";
import ExperienceCard from "@/components/ExperienceCard";
import { type ExperienceConfig } from "@/features/portfolio";
import FluidContainer from "@/components/FluidContainer";
import SectionHeader from "@/components/SectionHeader";

type Props = {
  readonly items: ExperienceConfig[];
};

export default function ExperienceSection({ items }: Readonly<Props>) {
  return (
    <FluidContainer as="section" id="experience" className="section">

      <SectionHeader title="Experience" align="left" />
      <Carousel
        items={items || []}
        progressLabelPrefix="Role"
        renderItem={(item) => <ExperienceCard experience={item} />}
      />
    </FluidContainer>
  );
}
