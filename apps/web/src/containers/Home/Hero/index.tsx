import clsx from "clsx";
import styles from "./styles.module.scss";
import FluidContainer from "@/components/FluidContainer";
import HeroActions from "./HeroActions";
import HeroStage from "./HeroStage";
import HeroDeck, { type HeroHighlights } from "./HeroDeck";
import HeroAbout from "./HeroAbout";
import SocialLinks, { type SocialItem } from "@/components/SocialLinks";
import { getT } from "@/i18n/server";
import { splitParagraphs } from "@dival-sehgal/utils/string";

/** Links only; the copy comes from translations. */
export type HeroData = {
  primaryCtaHref?: string;
  secondaryCtaHref?: string;
  resumeUrl?: string;
};

interface HeroProps {
  data?: HeroData;
  /** Real highlights for the card deck beside the name. */
  highlights?: HeroHighlights;
  socials?: SocialItem[];
}

/**
 * The name split into words and letters on the server, so the intro animation
 * is pure CSS and starts at first paint (no JavaScript, no hidden hero).
 * Screen readers get the plain text; the letter spans are hidden from them.
 */
function SplitTitle({ text }: Readonly<{ text: string }>) {
  let index = 0;
  return (
    <>
      <span className={styles["hero__sr-only"]}>{text}</span>
      <span aria-hidden="true">
        {text.split(/(\s+)/).map((part, partIndex) =>
          /^\s+$/.test(part) || !part ? (
            part
          ) : (
            <span key={`${part}-${partIndex}`} className={styles["hero__word"]}>
              {Array.from(part).map((char, charIndex) => (
                <span
                  key={`${char}-${charIndex}`}
                  className={styles["hero__letter"]}
                  style={{ "--i": index++ } as React.CSSProperties}
                >
                  {char}
                </span>
              ))}
            </span>
          ),
        )}
      </span>
    </>
  );
}

/** Copy on the left; on the right a deck led by the portrait, then highlights. */
export default function Hero({ data, highlights, socials = [] }: HeroProps) {
  const t = getT();
  const title = t("common.siteName");
  const subtitle = t("hero.subtitle");
  // The bio's first paragraph restates the subtitle, so the fold starts after it.
  const bio = splitParagraphs(t("about.body")).slice(1);

  return (
    <FluidContainer as="section" className={clsx("section", styles.hero)} id="home">
      <div className={styles["hero__grid"]}>
        <HeroStage className={styles["hero__copy"]}>
          <p className={clsx(styles["hero__greeting"], styles["hero__rise"])}>{t("hero.greeting")}</p>
          <h1 className={styles["hero__heading"]}>
            <SplitTitle text={title} />
          </h1>
          <p className={clsx(styles["hero__subheading"], styles["hero__rise-soft"])}>{subtitle}</p>
          <div className={styles["hero__rise"]} style={{ "--delay": "0.7s" } as React.CSSProperties}>
            <HeroAbout summary={t("about.title")} paragraphs={bio} />
          </div>
          <div className={styles["hero__rise"]} style={{ "--delay": "0.8s" } as React.CSSProperties}>
            <HeroActions data={data} className={styles["hero__actions"]} />
          </div>
          {/* From desktop up these live in the SocialDock on the left edge instead. */}
          <div className={clsx(styles["hero__rise"], styles["hero__socials-row"])} style={{ "--delay": "0.9s" } as React.CSSProperties}>
            <SocialLinks socialItems={socials} className={styles["hero__socials"]} />
          </div>
        </HeroStage>
        <HeroDeck {...(highlights ?? { skills: [] })} />
      </div>
    </FluidContainer>
  );
}
