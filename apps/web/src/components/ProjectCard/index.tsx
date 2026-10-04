import Image from "next/image";
import Button from "@dival-sehgal/ui/button";

import { ArrowOutwardIcon } from "@dival-sehgal/ui/icons";
import { type ProjectConfig } from "@/features/portfolio";
import GlassCard from "../GlassCard";
import { trackAttrs, ANALYTICS_EVENTS } from "@/utils/analytics";
import { getT } from "@/i18n/server";

type Props = {
  readonly project: ProjectConfig;
};

export default function ProjectCard({ project }: Readonly<Props>) {
  const t = getT();
  const visual = (
    <Image
      src={project.image || '/placeholder-project.jpg'}
      alt={project.name}
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      style={{ objectFit: 'cover', objectPosition: 'top center' }}
      priority={false}
      quality={80}
    />
  );

  const action = (project.link || project.repo) ? (
    <Button
      endIcon={<ArrowOutwardIcon />}
      target="_blank"
      rel="noopener noreferrer"
      href={(project.link || project.repo) as string}
      aria-label={t("project.ctaLabel", { name: project.name })}
      {...trackAttrs(ANALYTICS_EVENTS.PROJECT_CLICK, { projectName: project.name, linkType: project.link ? "live" : "repo" })}
    >
      {t("project.cta")}
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
