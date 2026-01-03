"use client";

import { Card, CardContent, Typography, Chip, Box } from "@mui/material";
import styles from "./styles.module.scss";
import { ExperienceConfig } from "@/lib/config/portfolio";

type Props = {
  readonly experience: ExperienceConfig;
};

export default function ExperienceCard({ experience }: Props) {
  return (
    <Card className={styles["experience-card"]} variant="outlined">
      <CardContent className={styles["experience-card__content"]}>
        <div className={styles["experience-card__body"]}>
          {/* LEFT COLUMN */}
          <Box className={styles["experience-card__header"]}>
            <Typography
              component="h3"
              className={styles["experience-card__role"]}
            >
              {experience.role}
            </Typography>
            <Typography
              component="p"
              className={styles["experience-card__company"]}
            >
              {experience.company}
            </Typography>
            <Typography
              component="p"
              className={styles["experience-card__period"]}
            >
              {experience.period}
            </Typography>
            {experience.location && (
              <Typography
                component="p"
                className={styles["experience-card__location"]}
              >
                {experience.location}
              </Typography>
            )}
            {experience.techStack && experience?.techStack?.length > 0 && (
              <Box className={styles["experience-card__tags"]}>
                {experience.techStack.map((tech) => (
                  <Chip
                    key={tech}
                    label={tech}
                    size="small"
                    className={styles["experience-card__tag"]}
                  />
                ))}
              </Box>
            )}
          </Box>

          {/* RIGHT COLUMN */}
          <div className={styles["experience-card__right"]}>
            <ul className={styles["experience-card__description-list"]}>
              {experience?.description?.map((item) => (
                <li
                  key={item.id}
                  className={styles["experience-card__description-item"]}
                >
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
