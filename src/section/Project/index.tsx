"use client";

import { Container } from "@mui/material";
import Carousel from "@/components/Carousel";
import ProjectCard from "@/components/ProjectCard";
import styles from "./styles.module.scss";
import { ProjectConfig } from "@/lib/config/portfolio";

type Props = {
  readonly items: readonly ProjectConfig[];
};

export default function Project({ items }: Props) {
  return (
    <section id="projects" className={`${styles.projects} section`}>
      <Container maxWidth="lg" className="section__inner">
        <Carousel title="Projects" subtitle="Selected work and experiments.">
          {items.map((project) => (
            <ProjectCard key={project.name} project={project} />
          ))}
        </Carousel>
      </Container>
    </section>
  );
}
