import Link from "next/link";
import clsx from "clsx";
import { HomeIcon, KeyboardArrowRightIcon } from "@dival-sehgal/ui/icons";
import FluidContainer from "../FluidContainer";
import styles from "./styles.module.scss";
import type { BreadcrumbItem } from "@/types";
import ParticlesBackground from "../ParticlesBackground";
import JsonLd from "../JsonLd";
import { SITE_URL } from "@/lib/config/site";
import { getT } from "@/i18n/server";

interface BreadcrumbsProps {
  items: readonly BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className }: Readonly<BreadcrumbsProps>) {
  const t = getT();
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ label: t("nav.home"), href: "/" }, ...items].map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: `${SITE_URL}${item.href === "/" ? "" : item.href}`,
    })),
  };

  return (
    <nav className={clsx(styles.breadcrumbs, className)} aria-label={t("breadcrumbs.label")}>
      <div className={styles["breadcrumbs__particles"]} aria-hidden="true">
        <ParticlesBackground
          id="breadcrumbs-particles"
          className={styles["breadcrumbs__particles-canvas"]}
          fullScreen={false}
        />
      </div>
      <JsonLd data={breadcrumbJsonLd} />
      <FluidContainer className={styles["breadcrumbs__content"]}>
        <ol className={styles["breadcrumbs__list"]}>
          <li className={styles["breadcrumbs__item"]}>
            <Link href="/" className={styles["breadcrumbs__link"]}>
              <HomeIcon fontSize="inherit" className={styles["breadcrumbs__home-icon"]} aria-hidden="true" focusable="false" />
              <span className="sr-only">{t("nav.home")}</span>
            </Link>
          </li>

          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const isDisabled = item.disabled;
            let content;

            if (isLast) {
              content = (
                <span className={styles["breadcrumbs__current"]} aria-current="page">
                  {item.label}
                </span>
              );
            } else if (isDisabled) {
              content = (
                <span className={styles["breadcrumbs__disabled"]} aria-disabled="true">
                  {item.label}
                </span>
              );
            } else {
              content = (
                <Link href={item.href} className={styles["breadcrumbs__link"]}>
                  {item.label}
                </Link>
              );
            }

            return (
              <li key={item.href} className={styles["breadcrumbs__item"]}>
                <KeyboardArrowRightIcon
                  fontSize="inherit"
                  className={styles["breadcrumbs__separator"]}
                  aria-hidden="true"
                  focusable="false"
                />
                {content}
              </li>
            );
          })}
        </ol>
      </FluidContainer>
    </nav>
  );
}
