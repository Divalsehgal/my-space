import Link from "next/link";
import { ArrowForwardIcon } from "@dival-sehgal/ui/icons";
import styles from "./styles.module.scss";
import FluidContainer from "@/components/FluidContainer";
import ParticlesBackground from "@/components/ParticlesBackground";
import { trackAttrs, ANALYTICS_EVENTS } from "@/utils/analytics";
import { getT } from "@/i18n/server";

export type HomeTopBarLatestPost = {
  slug: string;
  title: string;
  relativeLabel: string | null;
};

type HomeTopBarProps = {
  readonly latestPost?: HomeTopBarLatestPost | null;
};

export default function HomeTopBar({ latestPost }: HomeTopBarProps) {
  const t = getT();
  if (!latestPost) {
    return null;
  }

  return (
    <div className={styles["home-top-bar"]}>
      <div className={styles["home-top-bar__particles"]} aria-hidden="true">
        <ParticlesBackground
          id="home-top-bar-particles"
          className={styles["home-top-bar__particles-canvas"]}
          fullScreen={false}
          count={1000}
        />
      </div>
      <FluidContainer className={styles["home-top-bar__container"]}>
        {/* Only the post title (and its arrow) is the link, not the whole strip. */}
        <div className={styles["home-top-bar__announcement"]}>
          <span className={styles["home-top-bar__tag"]}>{t("blog.newBadge")}</span>
          <Link
            href={`/blogs/${latestPost.slug}`}
            className={styles["home-top-bar__link"]}
            {...trackAttrs(ANALYTICS_EVENTS.NAV_CLICK, {
              label: latestPost.title,
              href: `/blogs/${latestPost.slug}`,
              location: "home-top-bar",
            })}
          >
            <span className={styles["home-top-bar__title"]}>{latestPost.title}</span>
            <ArrowForwardIcon className={styles["home-top-bar__arrow"]} fontSize="inherit" />
          </Link>
          {latestPost.relativeLabel && (
            <span className={styles["home-top-bar__meta"]}>{latestPost.relativeLabel}</span>
          )}
        </div>
      </FluidContainer>
    </div>
  );
}
