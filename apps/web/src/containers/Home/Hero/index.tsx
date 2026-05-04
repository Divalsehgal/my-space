"use client";


import clsx from "clsx";
import styles from "./styles.module.scss";
import FluidContainer from "@/components/FluidContainer";
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import DescriptionIcon from '@mui/icons-material/Description';
import Button from "@mui/material/Button";
import BackgroundPattern from "@/components/BackgroundPattern";
import ParticlesBackground from "@/components/ParticlesBackground";
import { Box } from "@mui/system";
import { trackInteraction, ANALYTICS_EVENTS } from "@/utils/analytics";
import { usePortfolioContext } from "@/context/PortfolioContext";

type HeroData = {
  title: string;
  subtitle: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  resumeLabel?: string;
  resumeUrl?: string;
  badge?: {
    enabled: boolean;
    label: string;
  };
};

const getButtons = (data?: HeroData) => [
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
    color: "secondary" as const,
    size: "large" as const,
  },
  {
    label: data?.resumeLabel || "Resume",
    href: data?.resumeUrl,
    variant: "text" as const,
    color: "secondary" as const,
    size: "large" as const,
    startIcon: <DescriptionIcon />,
    target: "_blank",
    rel: "noopener noreferrer",
  },
];

export default function Hero() {
  const data = usePortfolioContext()?.hero;

  const title = data?.title || "Dival Sehgal";
  const subtitle = data?.subtitle || "Full-Stack Engineer";
  const badge = data?.badge;

  const buttons = getButtons(data);

  return (
    <FluidContainer as="section" className={clsx("section", styles.hero)} id="home">
      <BackgroundPattern />
      <Box sx={{ position: 'relative', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
        <ParticlesBackground />
      </Box>
      <div className={styles["hero__container"]}>
        {badge?.enabled && (
          <div className={styles["hero__badge"]}>
            {badge.label}
          </div>
        )}
        <h1 className={clsx(styles["hero__heading"], "MuiTypography-root", "MuiTypography-h1")}>
          {title}
        </h1>
        <h2 className={clsx(styles["hero__subheading"], "MuiTypography-root", "MuiTypography-h2")}>
          {subtitle}
        </h2>
        <div className={styles["hero__actions"]}>
          {
            buttons.map((button, index) => (
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
                    trackInteraction(ANALYTICS_EVENTS.RESUME_VIEW, { label: "Hero Resume Button" });
                  } else {
                    trackInteraction(ANALYTICS_EVENTS.NAV_CLICK, { label: button.label, href: button.href || "", location: "navbar" });
                  }
                }}
              >
                {button.label}
              </Button>
            ))
          }
        </div>

        <div className={styles["hero__scroll-indicator"]}>
          <KeyboardDoubleArrowDownIcon fontSize="large" />
        </div>
      </div>
    </FluidContainer>
  );
}
