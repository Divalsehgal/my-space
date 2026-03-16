"use client";

import { Button } from "@mui/material";
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import { ProjectConfig } from "@/lib/config/portfolio";
import GlassCard from "../GlassCard";

type Props = {
  readonly project: ProjectConfig;
};

export default function ProjectCard({ project }: Readonly<Props>) {
  const visual = (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${project.image || '/placeholder-project.jpg'})`,
        backgroundSize: 'cover',
        backgroundPosition: 'top center'
      }}
    />
  );

  const action = (project.link || project.repo) ? (
    <Button
      variant="contained"
      color="primary"
      endIcon={<ArrowOutwardIcon />}
      href={project.link || project.repo}
      disabled={!project.link && !project.repo}
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
