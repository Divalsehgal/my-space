
import clsx from "clsx";
import styles from "./styles.module.scss";
import FluidContainer from "@/components/FluidContainer";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";


import SectionHeader from "@/components/SectionHeader";
import BackgroundPattern from "@/components/BackgroundPattern";
import AboutSocialLinks from "./AboutSocialLinks";


type SocialItem = {
  label: string;
  href: string;
  icon?: string;
};

type AboutData = {
  title: string;
  paragraphs?: string[];
  facts?: string[];
};

interface AboutProps {
  data?: AboutData;
  socials?: SocialItem[];
}

export default function About({ data, socials }: AboutProps) {

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

            <div className={styles["about__copy"]}>
              {paragraphs.map((text, index) => (
                <Typography
                  key={`${text}-${index}`}
                  variant="body1"
                  className={clsx(
                    styles["about__description"],
                    index === 0 && styles["about__description--lead"],
                  )}
                >
                  {text}
                </Typography>
              ))}
            </div>

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
                  <AboutSocialLinks socialItems={socialItems} containerClassName={styles["about__social-links"]} btnClassName={styles["about__social-btn"]} />
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        </div>
      </div>
    </FluidContainer>
  );
}
