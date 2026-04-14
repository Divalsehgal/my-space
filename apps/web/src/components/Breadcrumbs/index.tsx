import Link from "next/link";
import styles from "./styles.module.scss";
import FluidContainer from "../FluidContainer";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import HomeIcon from "@mui/icons-material/Home";
import type { BreadcrumbItem } from "@/types";

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items ,  className }: BreadcrumbsProps) {
  return (
    <nav className={`${styles.breadcrumbs} ${className}`} aria-label="Breadcrumb">
      <FluidContainer>
        <ol className={styles["breadcrumbs__list"]}>
          <li className={styles["breadcrumbs__item"]}>
            <Link href="/" className={styles["breadcrumbs__link"]}>
              <HomeIcon className={styles["breadcrumbs__home-icon"]} />
              <span className="sr-only">Home</span>
            </Link>
          </li>
          
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            
            return (
              <li key={item.href} className={styles["breadcrumbs__item"]}>
                <KeyboardArrowRightIcon className={styles["breadcrumbs__separator"]} />
                {isLast ? (
                  <span className={styles["breadcrumbs__current"]} aria-current="page">
                    {item.label}
                  </span>
                ) : (
                  <Link href={item.href} className={styles["breadcrumbs__link"]}>
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </FluidContainer>
    </nav>
  );
}
