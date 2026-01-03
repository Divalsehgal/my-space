"use client";
import { Button, Container } from "@mui/material";
import styles from "./styles.module.scss";
import { PortfolioConfig } from "@/lib/config/portfolio";

type HeroProps = {
  readonly data: PortfolioConfig["hero"];
};

export default function Hero({ data }: HeroProps) {
  return (
    <section id="home" className={`${styles.hero} section`}>
      <Container maxWidth="lg" className="section__inner">
        <div className={styles["hero__container"]}>
          <div className={styles["hero__content"]}>
            <h1 className={styles["hero__title"]}>
              {data?.title?.split("Dival")?.length > 1 ? (
                <>
                  {data?.title.split("Dival")[0]}
                  <span className={styles["hero__name"]}>Dival</span>
                  {data?.title.split("Dival")[1]}
                </>
              ) : (
                data?.title
              )}
            </h1>

            <p className={styles["hero__lede"]}>{data.subtitle}</p>

            <div className={styles["hero__actions"]}>
              {data.primaryCtaLabel && (
                <Button
                  variant="contained"
                  href={data.primaryCtaHref}
                  size="large"
                >
                  {data.primaryCtaLabel}
                </Button>
              )}
              {data.secondaryCtaLabel && (
                <Button
                  variant="outlined"
                  href={data.secondaryCtaHref}
                  size="large"
                >
                  {data.secondaryCtaLabel}
                </Button>
              )}
            </div>
          </div>

          <div className={styles["hero__visual"]}>
            <div className={styles["hero__illustration"]} />
          </div>
        </div>
      </Container>
    </section>
  );
}
