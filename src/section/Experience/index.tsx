"use client";

import { Container } from "@mui/material";
import Carousel from "@/components/Carousel";
import ExperienceCard from "@/components/ExperienceCard";
import styles from "./styles.module.scss";
import { ExperienceConfig } from "@/lib/config/portfolio";

type Props = {
  readonly items: ExperienceConfig[];
};

export default function ExperienceSection({ items }: Readonly<Props>) {
  return (
    <section id="experience" className={`${styles.experience} section`}>
      <Container maxWidth="lg" className="section__inner">
        <Carousel
          title="Experience"
          subtitle="Roles I've worked in"
        >
          {items.map((exp) => (
            <ExperienceCard
              key={`${exp.company}-${exp.role}-${exp.period}`}
              experience={exp}
            />
          ))}
        </Carousel>
      </Container>
    </section>
  );
}
