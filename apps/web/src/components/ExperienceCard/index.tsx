"use client";

import { ExperienceConfig } from "@/lib/config/portfolio";
import GlassCard from "../GlassCard";

type Props = {
  readonly experience: ExperienceConfig;
};

export default function ExperienceCard({ experience }: Readonly<Props>) {
  return (
    <GlassCard
      title={`${experience.role} @ ${experience.company}`}
      description={experience.description[0]?.text}
      tags={experience.techStack}
    />
  );
}
