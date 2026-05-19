"use client";

import Button from "@mui/material/Button";
import DescriptionIcon from "@mui/icons-material/Description";
import clsx from "clsx";
import { trackInteraction, ANALYTICS_EVENTS } from "@/utils/analytics";
import styles from "./styles.module.scss";

export type HeroActionsData = {
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  resumeLabel?: string;
  resumeUrl?: string;
};

interface HeroActionsProps {
  data?: HeroActionsData;
  className?: string;
}

export default function HeroActions({ data, className }: HeroActionsProps) {
  const buttons = [
    {
      label: data?.primaryCtaLabel || "View Projects",
      href: data?.primaryCtaHref ?? "#projects",
      variant: "contained" as const,
      color: "primary" as const,
      size: "large" as const,
    },
    {
      label: data?.secondaryCtaLabel || "Contact",
      href: data?.secondaryCtaHref ?? "#contact",
      variant: "outlined" as const,
      color: "primary" as const,
      size: "large" as const,
    },
    {
      label: data?.resumeLabel || "Resume",
      href: data?.resumeUrl,
      variant: "text" as const,
      color: "primary" as const,
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
          component="a"
          variant={button.variant}
          color={button.color}
          size={button.size}
          href={button.href as string}
          startIcon={button.startIcon}
          target={button.target}
          rel={button.rel}
          onClick={() => {
            if (button.label === "Resume") {
              trackInteraction(ANALYTICS_EVENTS.RESUME_VIEW, {
                label: "Hero Resume Button",
              });
            } else {
              trackInteraction(ANALYTICS_EVENTS.NAV_CLICK, {
                label: button.label,
                href: button.href || "",
                location: "navbar",
              });
            }
          }}
        >
          {button.label}
        </Button>
      ))}
    </div>
  );
}
