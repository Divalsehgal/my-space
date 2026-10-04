import Button from "@dival-sehgal/ui/button";
import { DescriptionIcon } from "@dival-sehgal/ui/icons";
import clsx from "clsx";
import { trackAttrs, ANALYTICS_EVENTS } from "@/utils/analytics";
import styles from "./styles.module.scss";
import { getT } from "@/i18n/server";

export type HeroActionsData = {
  primaryCtaHref?: string;
  secondaryCtaHref?: string;
  resumeUrl?: string;
};

interface HeroActionsProps {
  data?: HeroActionsData;
  className?: string;
}

// Literal class names (not template strings) so PurgeCSS keeps these rules.
const CTA_CLASS = {
  contained: styles["cta--contained"],
  outlined: styles["cta--outlined"],
  text: undefined,
};

export default function HeroActions({ data, className }: HeroActionsProps) {
  const t = getT();
  const buttons = [
    {
      id: "projects",
      label: t("hero.ctaProjects"),
      href: data?.primaryCtaHref ?? "#projects",
      variant: "contained" as const,
      size: "large" as const,
    },
    {
      id: "contact",
      label: t("hero.ctaContact"),
      href: data?.secondaryCtaHref ?? "#contact",
      variant: "outlined" as const,
      size: "large" as const,
    },
    {
      id: "resume",
      label: t("hero.ctaResume"),
      href: data?.resumeUrl,
      variant: "text" as const,
      size: "large" as const,
      startIcon: <DescriptionIcon />,
      target: "_blank",
      rel: "noopener noreferrer",
    },
  ];

  return (
    <div className={clsx(styles.actions, className)}>
      {buttons.map((button, index) => (
        <Button
          key={index}
          variant={button.variant}
          className={clsx(styles.cta, CTA_CLASS[button.variant])}
          size={button.size}
          href={button.href as string}
          startIcon={button.startIcon}
          target={button.target}
          rel={button.rel}
          {...(button.id === "resume"
            ? trackAttrs(ANALYTICS_EVENTS.RESUME_VIEW, { label: "Hero Resume Button" })
            : trackAttrs(ANALYTICS_EVENTS.NAV_CLICK, { label: button.label, href: button.href || "", location: "navbar" }))}
        >
          {button.label}
        </Button>
      ))}
    </div>
  );
}
