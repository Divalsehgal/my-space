import type { ReactNode } from "react";
import Carousel from "@/components/Carousel";
import styles from "./styles.module.scss";

export type BlogStep = { id: string; title: string; content: ReactNode };

type BlogStepsProps = {
  /** Names the walkthrough; also the carousel's progress label ("Title 2 / 4"). */
  title: string;
  /** Step bodies are pre-rendered by the rich-text renderer, so this stays server-side. */
  steps: readonly BlogStep[];
};

/** A post-embedded walkthrough: readers step through a concept one slide at a time. */
export function BlogSteps({ title, steps }: Readonly<BlogStepsProps>) {
  if (steps.length === 0) {
    return null;
  }

  return (
    <section className={styles.steps} aria-label={title}>
      <Carousel
        progressLabelPrefix={title}
        showDots={steps.length > 1}
        showNavigation={steps.length > 1}
        slides={steps.map((step, index) => (
          <div key={step.id} className={styles.step}>
            <p className={styles.step__title}>
              <span className={styles.step__number} aria-hidden="true">
                {index + 1}
              </span>
              {step.title}
            </p>
            {step.content && <div className={styles.step__body}>{step.content}</div>}
          </div>
        ))}
      />
    </section>
  );
}
