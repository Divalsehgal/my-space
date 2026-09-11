"use client";

import Link from "next/link";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import styles from "./styles.module.scss";
import FluidContainer from "@/components/FluidContainer";
import { trackInteraction, ANALYTICS_EVENTS } from "@/utils/analytics";

export type HomeTopBarLatestPost = {
  slug: string;
  title: string;
  relativeLabel: string | null;
};

type HomeTopBarProps = {
  readonly latestPost?: HomeTopBarLatestPost | null;
};

export default function HomeTopBar({ latestPost }: HomeTopBarProps) {
  if (!latestPost) {
    return null;
  }

  return (
    <div className={styles["home-top-bar"]}>
      <FluidContainer className={styles["home-top-bar__container"]}>
        <Link
          href={`/blogs/${latestPost.slug}`}
          className={styles["home-top-bar__announcement"]}
          onClick={() => {
            trackInteraction(ANALYTICS_EVENTS.NAV_CLICK, {
              label: latestPost.title,
              href: `/blogs/${latestPost.slug}`,
              location: "home-top-bar",
            });
          }}
        >
          <span className={styles["home-top-bar__tag"]}>New Blog</span>
          <span className={styles["home-top-bar__title"]}>{latestPost.title}</span>
          {latestPost.relativeLabel && (
            <span className={styles["home-top-bar__meta"]}>{latestPost.relativeLabel}</span>
          )}
          <ArrowForwardIcon className={styles["home-top-bar__arrow"]} fontSize="inherit" />
        </Link>
      </FluidContainer>
    </div>
  );
}
