import clsx from "clsx";
import { Unbounded } from "next/font/google";
import styles from "./styles.module.scss";
import FluidContainer from "@/components/FluidContainer";
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import ParticlesBackground from "@/components/ParticlesBackground";
import HeroActions from "./HeroActions";

const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-hero-heading",
  display: "swap",
});

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
        <h4 className={styles["hero__greeting"]}>Hi, I&apos;m</h4>
        <h1 className={clsx(styles["hero__heading"], unbounded.variable, "MuiTypography-root", "MuiTypography-h1")}>
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
