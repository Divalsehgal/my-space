"use client";

import React, { useActionState, useEffect, use, useState } from "react";
import { type SvgIconProps } from "@mui/material";

import clsx from "clsx";
import styles from "./styles.module.scss";
import GitHubIcon from "@mui/icons-material/GitHub";
import InstagramIcon from "@mui/icons-material/Instagram";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import { type ContactFormState } from "@/types/contact";
import { ToastContext } from "@/context/ToastContext";
import SectionHeader from "@/components/SectionHeader";
import FluidContainer from "@/components/FluidContainer";
import { trackInteraction, ANALYTICS_EVENTS } from "@/utils/analytics";
import { usePortfolioContext } from "@/context/PortfolioContext";

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

type ContactProps = Readonly<{
  action: (prevState: ContactFormState, formData: FormData) => Promise<ContactFormState>;
}>;

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

export default function Contact({ action }: ContactProps) {
  const config = usePortfolioContext();
  const data = config?.contact;
  const socialItems = (config?.socials as SocialItem[]) || [];
  const [messageLength, setMessageLength] = useState(0);

  const toastContext = use(ToastContext);
  const showToast = toastContext?.showToast;

  const [state, formAction, isPending] = useActionState(
    action,
    { status: "idle" }
  );

  useEffect(() => {
    if (state.status !== "idle" && state.message && showToast) {
      showToast(state.message, state.status === "success" ? "success" : "error");

      if (state.status === "success") {
        trackInteraction(ANALYTICS_EVENTS.CONTACT_SUBMIT, { status: "success", message: state.message });
        const form = document.getElementById("contact-form") as HTMLFormElement;
        form?.reset();
        setTimeout(() => setMessageLength(0), 0);
      } else if (state.status === "error") {
        trackInteraction(ANALYTICS_EVENTS.CONTACT_SUBMIT, { status: "error", message: state.message });
      }
    }
  }, [state, showToast]);

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
        <ContactForm 
          formAction={formAction}
          isPending={isPending}
          state={state}
          messageLength={messageLength}
          onMessageChange={setMessageLength}
        />
      </div>
    </FluidContainer>
  );
}
