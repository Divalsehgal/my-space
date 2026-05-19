"use client";

import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import GitHubIcon from "@mui/icons-material/GitHub";
import InstagramIcon from "@mui/icons-material/Instagram";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import { type SvgIconProps } from "@mui/material";
import { trackInteraction, ANALYTICS_EVENTS } from "@/utils/analytics";

const ICON_MAP: Record<string, React.ComponentType<SvgIconProps>> = {
  github: GitHubIcon,
  linkedin: LinkedInIcon,
  instagram: InstagramIcon,
};

type SocialItem = {
  label: string;
  href: string;
  icon?: string;
};

interface AboutSocialLinksProps {
  socialItems: SocialItem[];
  btnClassName?: string;
  containerClassName?: string;
}

export default function AboutSocialLinks({
  socialItems,
  btnClassName,
  containerClassName,
}: AboutSocialLinksProps) {
  return (
    <div className={containerClassName}>
      {socialItems.map((social) => {
        const Icon = ICON_MAP[social.icon?.toLowerCase() || ""] || null;
        return (
          <IconButton
            key={social.href}
            className={btnClassName}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.label}
            size="large"
            onClick={() => {
              trackInteraction(ANALYTICS_EVENTS.SOCIAL_CLICK, {
                platform: social.label,
                href: social.href,
              });
            }}
          >
            {Icon ? (
              <Icon fontSize="large" />
            ) : (
              <Typography variant="caption" sx={{ fontWeight: "bold" }}>
                {social.label.substring(0, 2).toUpperCase()}
              </Typography>
            )}
          </IconButton>
        );
      })}
    </div>
  );
}
