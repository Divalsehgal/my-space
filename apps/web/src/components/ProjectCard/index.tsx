"use client";

import Image from "next/image";
import { Button } from "@mui/material";
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import { type ProjectConfig } from "@/features/portfolio";
import GlassCard from "../GlassCard";
import { trackEvent } from "@/utils/analytics";

type Props = {
  readonly project: ProjectConfig;
};

export default function ProjectCard({ project }: Readonly<Props>) {
  const visual = (
    <Image
      src={project.image || '/placeholder-project.jpg'}
      alt={project.name}
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      style={{ objectFit: 'cover', objectPosition: 'top center' }}
      priority={false}
    />
  );

  const action = (project.link || project.repo) ? (
    <Button
      component="a"
      variant="contained"
      color="primary"
      endIcon={<ArrowOutwardIcon />}
      target="_blank"
      rel="noopener noreferrer"
      href={(project.link || project.repo) as string}
      disabled={!project.link && !project.repo}
      onClick={() => {
        trackEvent("click", "Project", { label: project.name });
      }}
    >
      View Project Details
    </Button>
  ) : null;

  return (
    <GlassCard
      visual={visual}
      title={project.name}
      description={project.description}
      tags={project.techStack}
      action={action}
    />
  );
}
