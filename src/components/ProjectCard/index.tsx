"use client";
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Button,
} from "@mui/material";
import styles from "./styles.module.scss";
import { ProjectConfig } from "@/lib/config/portfolio";
import Image from "next/image";

type Props = { project: ProjectConfig };

// Make sure ProjectConfig has something like: image?: string;
export default function ProjectCard({ project }: Props) {
  return (
    <Card className={styles["project-card"]} variant="outlined">
      <CardContent className={styles["project-card__content"]}>
        {/* LEFT: text/content */}
        <Box className={styles["project-card__info"]}>
          {/* project name */}
          <Typography component="h3" className={styles["project-card__name"]}>
            {project.name}
          </Typography>

          {/* project description */}
          <Typography className={styles["project-card__description"]}>
            {project.description}
          </Typography>

          {/* tags */}
          {project.techStack && project.techStack.length > 0 && (
            <Box className={styles["project-card__tags"]}>
              {project.techStack.map((tech) => (
                <Chip
                  key={tech}
                  label={tech}
                  size="small"
                  className={styles["project-card__tag"]}
                />
              ))}
            </Box>
          )}

          {/* LINKS ROW */}
          {(project.link || project.repo) && (
            <Box className={styles["project-card__links"]}>
              {project.link && (
                <Button
                  variant="contained"
                  size="small"
                  href={project.link}
                  target="_blank"
                  rel="noopener"
                  className={styles["project-card__button"]}
                >
                  Live
                </Button>
              )}

              {project.repo && (
                <Button
                  variant="outlined"
                  size="small"
                  href={project.repo}
                  target="_blank"
                  rel="noopener"
                  className={styles["project-card__button"]}
                >
                  Code
                </Button>
              )}
            </Box>
          )}
        </Box>

        {/* RIGHT: image */}
        {project.image && (
          <Box className={styles["project-card__image-wrapper"]}>
            <Image
              width={500}
              height={300}
              priority={true}
              src={project.image}
              alt={project.name}
              className={styles["project-card__image"]}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
