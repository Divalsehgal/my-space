"use client";

import React from "react";
import clsx from "clsx";
import styles from "./styles.module.scss";
import FluidContainer from "@/components/FluidContainer";
import GitHubIcon from "@mui/icons-material/GitHub";
import InstagramIcon from "@mui/icons-material/Instagram";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import {
  Typography,
  IconButton,
  Stack,
  Grid,
  SvgIconProps,
} from "@mui/material";
import SectionHeader from "@/components/SectionHeader";
import BackgroundPattern from "@/components/BackgroundPattern";
import { trackInteraction, ANALYTICS_EVENTS } from "@/utils/analytics";
import { usePortfolioContext } from "@/context/PortfolioContext";

const ICON_MAP: Record<string, React.ComponentType<SvgIconProps>> = {
  github: GitHubIcon,
  linkedin: LinkedInIcon,
  instagram: InstagramIcon,
};

export default function About() {
  const config = usePortfolioContext();
  const data = config?.about;
  const socials = config?.socials;

  const title = data?.title || "About Me";
  const paragraphs = data?.paragraphs || [];
  const facts = data?.facts || [];
  const socialItems = socials || [];

  return (
    <FluidContainer
      as="section"
      id="about"
      className={clsx("section", styles.about)}
    >
      <BackgroundPattern />
      <div className={styles["about__container"]}>
        <div
          className={clsx(
            styles["about__column"],
            styles["about__column--left"],
          )}
        >
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
        <div
          className={clsx(
            styles["about__column"],
            styles["about__column--right"],
          )}
        >
          <Stack spacing={2}>
            <SectionHeader title={title} align="left" />

            <Stack spacing={1}>
              {paragraphs.map((text: string) => (
                <Typography
                  key={text}
                  variant="body1"
                  className={styles["about__description"]}
                >
                  {text}
                </Typography>
              ))}
            </Stack>

            {/* Facts Section */}
            <Grid container spacing={4}>
              {facts.map((fact: string) => (
                <Grid
                  size={{ xs: 6, sm: "auto" }}
                  sx={{ flexGrow: 1 }}
                  key={fact}
                >
                  <Stack>
                    <Typography
                      variant="body2"
                      className={styles["about__fact-value"]}
                    >
                      {fact}
                    </Typography>
                  </Stack>
                </Grid>
              ))}

              {/* Integrated Social Links */}
              <Grid size={{ xs: 6, sm: "auto" }} sx={{ flexGrow: 1 }}>
                <Stack>
                  <Typography
                    variant="caption"
                    className={styles["about__fact-label"]}
                  >
                    Socials
                  </Typography>
                  <div className={styles["about__social-links"]}>
                    {socialItems.map((social) => {
                      const Icon =
                        ICON_MAP[social.icon?.toLowerCase() || ""] || null;
                      return (
                        <IconButton
                          key={social.href}
                          className={styles["about__social-btn"]}
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={social.label}
                          size="large"
                          onClick={() => {
                            trackInteraction(ANALYTICS_EVENTS.SOCIAL_CLICK, {
                              platform: social.label,
                              href: social.href,
                            });
                          }}
                        >
                          {Icon ? (
                            <Icon fontSize="large" />
                          ) : (
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: "bold" }}
                            >
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
