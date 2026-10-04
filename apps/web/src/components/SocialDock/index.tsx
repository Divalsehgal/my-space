import SocialLinks, { type SocialItem } from "@/components/SocialLinks";
import { getT } from "@/i18n/server";
import styles from "./styles.module.scss";

/**
 * The social links as a slim vertical dock on the left edge of the home page,
 * desktop and up. Smaller screens show the same links inline in the hero.
 */
export default function SocialDock({ socialItems }: Readonly<{ socialItems: SocialItem[] }>) {
  const t = getT();
  if (socialItems.length === 0) {return null;}
  return (
    <nav className={styles.dock} aria-label={t("about.socials")}>
      <SocialLinks socialItems={socialItems} className={styles["dock__links"]} />
      <span className={styles["dock__rule"]} aria-hidden="true" />
    </nav>
  );
}
