"use client";

import React from "react";
import { type PortfolioConfig } from "@/features/portfolio";
import styles from "./styles.module.scss";
import FluidContainer from "@/components/FluidContainer";
import GitHubIcon from '@mui/icons-material/GitHub';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import { Typography, IconButton, Stack, Grid, SvgIconProps } from "@mui/material";
import SectionHeader from "@/components/SectionHeader";
import BackgroundPattern from "@/components/BackgroundPattern";
import { trackEvent } from "@/utils/analytics";

const ICON_MAP: Record<string, React.ComponentType<SvgIconProps>> = {
  github: GitHubIcon,
  linkedin: LinkedInIcon,
  instagram: InstagramIcon,
};

type AboutProps = Readonly<{
  data: PortfolioConfig["about"];
  socials: PortfolioConfig["socials"];
}>;

export default function About({ data, socials }: AboutProps) {
  const title = data?.title || "About Me";
  const paragraphs = data?.paragraphs || [];
  const facts = data?.facts || [];
  const socialItems = socials || [];

  return (
    <FluidContainer
      as="section"
      id="about"
      className={`section ${styles.about}`}
    >
      <BackgroundPattern />
      <div className={styles["about__container"]}>
        <div className={styles["about__column-left"]}>
          <div className={styles["about__avatar-group"]}>
            <div className={styles["about__avatar-frame"]} />
            <div
              className={styles["about__avatar-image"]}
              style={{ backgroundImage: `url(./me.avif)` }}
            >
              <div className={styles["about__avatar-overlay"]} />
            </div>
          </div>
        </div>

        {/* Right Column: Content */}
        <div className={styles["about__column-right"]}>
          <Stack spacing={2}>
            <SectionHeader title={title || "About Me"} align="left" />

            <Stack spacing={1}>
              {paragraphs.map((text: string, index: number) => (
                <Typography key={index} variant="body1" className={styles["about__description"]}>
                  {text}
                </Typography>
              ))}
            </Stack>

            {/* Facts Section */}
            <Grid container spacing={4}>
              {facts.map((fact: string, index: number) => (
                <Grid size={{ xs: 6, sm: "auto" }} sx={{ flexGrow: 1 }} key={index}>
                  <Stack>
                    <Typography variant="body2" className={styles["about__fact-value"]}>
                      {fact}
                    </Typography>
                  </Stack>
                </Grid>
              ))}

              {/* Integrated Social Links */}
              <Grid size={{ xs: 6, sm: "auto" }} sx={{ flexGrow: 1 }}>
                <Stack>
                  <Typography variant="caption" className={styles["about__fact-label"]}>
                    Socials
                  </Typography>
                  <div className={styles["about__social-links-integrated"]}>
                    {socialItems.map((social: PortfolioConfig["socials"][number], index: number) => {
                      const Icon = ICON_MAP[social.icon?.toLowerCase() || ""] || null;
                      return (
                        <IconButton
                          key={index}
                          className={styles["about__social-btn"]}
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={social.label}
                          size="large"
                          onClick={() => {
                            trackEvent("click", "Social", social.label);
                          }}
                        >
                          {Icon ? <Icon fontSize="large" /> : (
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                              {social.label.substring(0, 2).toUpperCase()}
                            </Typography>
                          )}
                        </IconButton>
                      );
                    })}
                  </div>
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        </div>
      </div>
    </FluidContainer>
  );
}
