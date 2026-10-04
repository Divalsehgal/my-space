import clsx from "clsx";
import styles from "./styles.module.scss";
import { GitHubIcon, InstagramIcon, LinkedInIcon, type IconComponent } from "@dival-sehgal/ui/icons";
import SectionHeader from "@/components/SectionHeader";
import FluidContainer from "@/components/FluidContainer";

import ContactForm from "./Form";
import { getT } from "@/i18n/server";

const ICON_MAP: Record<string, IconComponent> = {
  github: GitHubIcon,
  linkedin: LinkedInIcon,
  instagram: InstagramIcon,
};

type SocialItem = {
  label: string;
  href: string;
  icon?: string;
};

function SocialLinks({ socialItems }: { socialItems: SocialItem[] }) {
  return (
    <div className={styles["contact__social-links"]}>
      {socialItems.map((social) => {
        const Icon = ICON_MAP[social.icon?.toLowerCase() || ""] || null;
        return (
          <a
            key={social.label}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            className={styles["contact__social-link"]}
            aria-label={social.label}
          >
            {Icon ? <Icon /> : social.label.substring(0, 2).toUpperCase()}
          </a>
        );
      })}
    </div>
  );
}

export default async function Contact({ socialItems }: { socialItems: SocialItem[] }) {
  const t = getT();
  return (
    <FluidContainer
      as="section"
      id="contact"
      className={clsx(styles.contact, "section")}
    >
      <SectionHeader
        title={
          <div className={styles["contact__title-wrapper"]}>
            {t("contact.title")}
            <SocialLinks socialItems={socialItems} />
          </div>
        }
        subtitle={
          t("contact.intro")
        }
        align="left"
      />
      <div className={styles["contact__container"]} data-reveal>
        <ContactForm />
      </div>
    </FluidContainer>
  );
}
