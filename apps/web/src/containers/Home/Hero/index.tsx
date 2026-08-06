import clsx from "clsx";
import styles from "./styles.module.scss";
import FluidContainer from "@/components/FluidContainer";
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import ParticlesBackground from "@/components/ParticlesBackground";
import HeroActions from "./HeroActions";

export type HeroData = {
  title: string;
  subtitle: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  resumeLabel?: string;
  resumeUrl?: string;
  badge?: {
    enabled: boolean;
    label: string;
  };
};

interface HeroProps {
  data?: HeroData;
}

export default function Hero({ data }: HeroProps) {
  const title = data?.title || "Dival Sehgal";
  const subtitle = data?.subtitle || "Full-Stack Engineer";
  const badge = data?.badge;

  return (
    <FluidContainer as="section" className={clsx("section", styles.hero)} id="home">
      <ParticlesBackground id="hero-particles" />
      <div className={styles["hero__container"]}>
        {badge?.enabled && (
          <div className={styles["hero__badge"]}>
            {badge.label}
          </div>
        )}
        <h1 className={clsx(styles["hero__heading"], "MuiTypography-root", "MuiTypography-h1")}>
          {title}
        </h1>
        <h2 className={clsx(styles["hero__subheading"], "MuiTypography-root", "MuiTypography-h2")}>
          {subtitle}
        </h2>
        <HeroActions data={data} className={styles["hero__actions"]} />
      </div>
      <div className={styles["hero__scroll-indicator"]}>
        <KeyboardDoubleArrowDownIcon fontSize="large" />
      </div>
    </FluidContainer>
  );
}
