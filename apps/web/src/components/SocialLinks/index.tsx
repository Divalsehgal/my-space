import IconButton from "@dival-sehgal/ui/icon-button";
import { GitHubIcon, InstagramIcon, LinkedInIcon, type IconComponent } from "@dival-sehgal/ui/icons";
import clsx from "clsx";
import { trackAttrs, ANALYTICS_EVENTS } from "@/utils/analytics";
import styles from "./styles.module.scss";

const ICON_MAP: Record<string, IconComponent> = {
  github: GitHubIcon,
  linkedin: LinkedInIcon,
  instagram: InstagramIcon,
};

export type SocialItem = {
  label: string;
  href: string;
  icon?: string;
};

interface SocialLinksProps {
  socialItems: SocialItem[];
  className?: string;
}

/** Icon buttons for the configured social profiles (hero on small screens, SocialDock on large). */
export default function SocialLinks({ socialItems, className }: Readonly<SocialLinksProps>) {
  if (socialItems.length === 0) {return null;}

  return (
    <div className={clsx(styles.socials, className)}>
      {socialItems.map((social) => {
        const Icon = ICON_MAP[social.icon?.toLowerCase() || ""] || null;
        return (
          <IconButton
            key={social.href}
            className={styles["socials__btn"]}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.label}
            {...trackAttrs(ANALYTICS_EVENTS.SOCIAL_CLICK, { platform: social.label, href: social.href })}
          >
            {Icon ? (
              <Icon />
            ) : (
              <span className={styles["socials__fallback"]}>{social.label.substring(0, 2).toUpperCase()}</span>
            )}
          </IconButton>
        );
      })}
    </div>
  );
}
