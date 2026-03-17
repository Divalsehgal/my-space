"use client";

import React from "react";
import { type PortfolioConfig } from "@/features/portfolio";
import styles from "./styles.module.scss";
import FluidContainer from "@/components/FluidContainer";
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import DescriptionIcon from '@mui/icons-material/Description';
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import BackgroundPattern from "@/components/BackgroundPattern";
import StarsCanvas from "@/components/StarsCanvas";
import ParticlesBackground from "@/components/ParticlesBackground";
import { Box } from "@mui/system";
import { motion, useScroll, useTransform } from "framer-motion";

type HeroProps = {
  readonly data: PortfolioConfig["hero"];
};

export default function Hero({ data }: HeroProps) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, -50]);

  const title = data?.title || "Dival Sehgal";
  const subtitle = data?.subtitle || "Full-Stack Engineer";
  const badge = data?.badge || "Available for new opportunities";

  const buttons: {
    label: string;
    href?: string;
    variant: NonNullable<React.ComponentProps<typeof Button>["variant"]>;
    color: NonNullable<React.ComponentProps<typeof Button>["color"]>;
    size: NonNullable<React.ComponentProps<typeof Button>["size"]>;
    startIcon?: React.ReactNode;
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
  }]

  return (
    <FluidContainer as="section" className={`section ${styles.hero}`} id="home">
      <BackgroundPattern />
      <Box sx={{ position: 'relative', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
        <ParticlesBackground />
      </Box>
      <div className={styles["hero__container"]}>
        <div className={styles["hero__badge"]}>
          {badge}
        </div>
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
