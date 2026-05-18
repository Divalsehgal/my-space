import Link from "next/link";
import clsx from "clsx";
import HomeIcon from "@mui/icons-material/Home";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import FluidContainer from "../FluidContainer";
import styles from "./styles.module.scss";
import type { BreadcrumbItem } from "@/types";

interface BreadcrumbsProps {
  items: readonly BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className }: Readonly<BreadcrumbsProps>) {
  return (
    <nav className={clsx(styles.breadcrumbs, className)} aria-label="breadcrumb">
      <FluidContainer>
        <ol className={styles["breadcrumbs__list"]}>
          <li className={styles["breadcrumbs__item"]}>
            <Link href="/" className={styles["breadcrumbs__link"]}>
              <HomeIcon className={styles["breadcrumbs__home-icon"]} aria-hidden="true" focusable="false" />
              <span className="sr-only">Home</span>
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
