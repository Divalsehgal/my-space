"use client";

import React from "react";
import styles from "./styles.module.scss";
import FluidContainer from "@/components/FluidContainer";
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import DescriptionIcon from '@mui/icons-material/Description';
import Button from "@mui/material/Button";
import BackgroundPattern from "@/components/BackgroundPattern";
import ParticlesBackground from "@/components/ParticlesBackground";
import { Box } from "@mui/system";
import { useScroll, useTransform } from "framer-motion";
import { trackEvent } from "@/utils/analytics";
import { usePortfolioContext } from "@/context/PortfolioContext";

export default function Hero() {
  const data = usePortfolioContext()?.hero;
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, -50]);

  const title = data?.title || "Dival Sehgal";
  const subtitle = data?.subtitle || "Full-Stack Engineer";
  const badge = data?.badge;

  const buttons: {
    label: string;
    href?: string;
    variant: NonNullable<React.ComponentProps<typeof Button>["variant"]>;
    color: NonNullable<React.ComponentProps<typeof Button>["color"]>;
    size: NonNullable<React.ComponentProps<typeof Button>["size"]>;
    startIcon?: React.ReactNode;
    target?: string;
    rel?: string;
  }[] = [{
    label: data?.primaryCtaLabel || "View Projects",
    href: data?.primaryCtaHref || "#projects",
    variant: "contained",
    color: "primary",
    size: "large",
  }, {
    label: data?.secondaryCtaLabel || "Contact",
    href: data?.secondaryCtaHref || "#contact",
    variant: "outlined",
    color: "secondary",
    size: "large",
  }, {
    label: data?.resumeLabel || "Resume",
    href: data?.resumeUrl,
    variant: "text",
    color: "secondary",
    size: "large",
    startIcon: <DescriptionIcon />,
    target: "_blank",
    rel: "noopener noreferrer",
  }]

  return (
    <FluidContainer as="section" className={`section ${styles.hero}`} id="home">
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
        <h1 className={`${styles["hero__heading"]} MuiTypography-root MuiTypography-h1`}>
          {title}
        </h1>
        <h2 className={`${styles["hero__subheading"]} MuiTypography-root MuiTypography-h2`}>
          {subtitle}
        </h2>
        <div className={styles["hero__actions"]}>
          {
            buttons.map((button: any, index: number) => (
              <Button
                key={index}
                variant={button.variant}
                color={button.color}
                size={button.size}
                href={button.href}
                startIcon={button.startIcon}
                target={button.target}
                rel={button.rel}
                onClick={() => {
                  trackEvent("click", "Hero", button.label);
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
