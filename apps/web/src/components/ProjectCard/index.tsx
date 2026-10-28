import Image from "next/image";
import Button from "@dival-sehgal/ui/button";
import LinkPreview from "@dival-sehgal/ui/link-preview";

import { ArrowOutwardIcon, GitHubIcon } from "@dival-sehgal/ui/icons";
import { type ProjectConfig } from "@/features/portfolio";
import GlassCard from "../GlassCard";
import { trackAttrs, ANALYTICS_EVENTS } from "@/utils/analytics";
import { getT } from "@/i18n/server";
import styles from "./styles.module.scss";

type Props = {
  readonly project: ProjectConfig;
};

/**
 * Live screenshot of a URL from Microlink's free screenshot API. `embed` makes
 * it redirect straight to the image, so it works as a plain <img src>. Only
 * fetched when someone hovers the live link, and cached by Microlink's CDN.
 */
export function screenshotUrl(url: string): string {
  const params = new URLSearchParams({
    url,
    screenshot: "true",
    meta: "false",
    embed: "screenshot.url",
    "viewport.width": "1280",
    "viewport.height": "800",
  });
  return `https://api.microlink.io/?${params.toString()}`;
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * A `link` that points at GitHub is really the source, not a live site — treat
 * it as the repo so it isn't labelled "Live demo" or given a screenshot preview.
 */
function resolveLinks({ link, repo }: ProjectConfig): { live?: string; source?: string } {
  if (link && hostname(link) === "github.com") {
    return { source: repo ?? link };
  }
  return { live: link, source: repo };
}

export default function ProjectCard({ project }: Readonly<Props>) {
  const t = getT();
  const { live: liveUrl, source: sourceUrl } = resolveLinks(project);
  const imageSrc = project.image || '/placeholder-project.jpg';
  const visual = (
    <Image
      src={imageSrc}
      alt={project.name}
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      style={{ objectFit: 'cover', objectPosition: 'top center' }}
      priority={false}
      quality={80}
      // Project images can live on any host (e.g. the project's own og-image),
      // which next/image's remotePatterns allow-list would reject.
      unoptimized={/^https?:\/\//.test(imageSrc)}
    />
  );

  const live = liveUrl ? (
    <LinkPreview
      src={screenshotUrl(liveUrl)}
      alt={t("project.previewAlt", { name: project.name })}
      label={hostname(liveUrl)}
    >
      <Button
        endIcon={<ArrowOutwardIcon />}
        target="_blank"
        rel="noopener noreferrer"
        href={liveUrl}
        aria-label={t("project.liveLabel", { name: project.name })}
        {...trackAttrs(ANALYTICS_EVENTS.PROJECT_CLICK, { projectName: project.name, linkType: "live" })}
      >
        {t("project.live")}
      </Button>
    </LinkPreview>
  ) : null;

  const repo = sourceUrl ? (
    <Button
      variant={liveUrl ? "outlined" : "contained"}
      startIcon={<GitHubIcon />}
      target="_blank"
      rel="noopener noreferrer"
      href={sourceUrl}
      aria-label={t("project.repoLabel", { name: project.name })}
      {...trackAttrs(ANALYTICS_EVENTS.PROJECT_CLICK, { projectName: project.name, linkType: "repo" })}
    >
      {t("project.repo")}
    </Button>
  ) : null;

  const action = (live || repo) ? (
    <div className={styles["project-card__actions"]}>
      {live}
      {repo}
    </div>
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
