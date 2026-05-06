import React from "react";
import { type SvgIconProps } from "@mui/material";

import clsx from "clsx";
import styles from "./styles.module.scss";
import GitHubIcon from "@mui/icons-material/GitHub";
import InstagramIcon from "@mui/icons-material/Instagram";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import SectionHeader from "@/components/SectionHeader";
import FluidContainer from "@/components/FluidContainer";
import { portfolioService } from "@/features/portfolio";

import ContactForm from "./ContactForm";

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

export default async function Contact() {
  const { config } = await portfolioService.getConfig();
  const data = config?.contact;
  const socialItems = (config?.socials as SocialItem[]) || [];

  return (
    <FluidContainer as="section" id="contact" className={clsx(styles.contact, "section")}>
      <SectionHeader
        title={
          <div className={styles["contact__title-wrapper"]}>
            {data?.title || "Get in Touch"}
            <SocialLinks socialItems={socialItems} />
          </div>
        }
        subtitle={data?.subtitle || "Feel free to reach out for collaborations or just a friendly hello!"}
        align="left"
      />
      <div className={styles["contact__container"]}>
        <ContactForm  />
      </div>
    </FluidContainer>
  );
}
