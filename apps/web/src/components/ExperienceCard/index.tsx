"use client";

import { type ExperienceConfig } from "@/features/portfolio";
import GlassCard from "../GlassCard";

type Props = {
  readonly experience: ExperienceConfig;
};

export default function ExperienceCard({ experience }: Readonly<Props>) {
  return (
    <GlassCard
      title={`${experience.role} @ ${experience.company}`}
      description={experience.description}
      tags={experience.techStack}
    />
  );
}
