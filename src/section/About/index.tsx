"use client";
import { Container, Typography, Box, Button } from "@mui/material";
import styles from "./styles.module.scss";
import { PortfolioConfig } from "@/lib/config/portfolio";
import SectionHeader from "@/components/SectionHeader";
import Image from "next/image";

type AboutProps = Readonly<{
  data: PortfolioConfig["about"];
}>;

export default function About({ data }: AboutProps) {
  return (
    <section id="about" className={`${styles.about} section`}>
      <Container maxWidth="lg" className="section__inner">
        <div className={styles["about__container"]}>
          {data.title && (
            <SectionHeader title={data.title || "About Me"} align="left" />
          )}
          <div className={styles["about__content"]}>
            <div className={styles["about__left"]}>
              <div className={styles["about__image-wrapper"]}>
                <img
                  src="https://api.dicebear.com/9.x/adventurer/svg?seed=Ryan"
                  alt="avatar"
                  className={styles["about__profile-image"]}
                />
              </div>
            </div>

            <div className={styles["about__right"]}>
              <Box className={styles["about__text"]}>
                {data.paragraphs.map((p, i) => (
                  <Typography key={i} className={styles["about__paragraph"]}>
                    {p}
                  </Typography>
                ))}
              </Box>

              <Box className={styles["about__actions"]}>
                <Button
                  variant="contained"
                  size="small"
                  href={data.resumeUrl}
                  target="_blank"
                  rel="noopener"
                >
                  Resume
                </Button>
                <Button variant="outlined" size="small" href="#contact">
                  Contact
                </Button>
              </Box>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
