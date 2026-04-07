"use client";

import { useActionState, useEffect, use } from "react";
import { useFormStatus } from "react-dom";
import {
  TextField,
  Button,
  Box,
} from "@mui/material";
import styles from "./styles.module.scss";
import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import GitHubIcon from "@mui/icons-material/GitHub";
import { type ContactFormState } from "@/types/contact";
import { ToastContext } from "@/context/ToastContext";
import SectionHeader from "@/components/SectionHeader";
import FluidContainer from "@/components/FluidContainer";
import { trackEvent } from "@/utils/analytics";
import { usePortfolioContext } from "@/context/PortfolioContext";

type ContactProps = Readonly<{
  action: (prevState: ContactFormState, formData: FormData) => Promise<ContactFormState>;
}>;

const initialState: ContactFormState = {
  status: "idle",
};

const socialLinks = [
  { icon: <InstagramIcon />, href: "https://instagram.com", label: "Instagram" },
  { icon: <FacebookIcon />, href: "https://facebook.com", label: "Facebook" },
  { icon: <LinkedInIcon />, href: "https://linkedin.com", label: "LinkedIn" },
  { icon: <GitHubIcon />, href: "https://github.com", label: "GitHub" },
];

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="contained"
      size="large"
      fullWidth
      disabled={pending}
      onClick={() => {
        trackEvent("click", "Contact", "Submit Button");
      }}
    >
      {pending ? "Sending..." : "Send Message"}
    </Button>
  );
}

export default function Contact({ action }: ContactProps) {
  const config = usePortfolioContext();
  const data = config?.contact;

  const toastContext = use(ToastContext);
  const showToast = toastContext?.showToast;

  const [state, formAction, isPending] = useActionState(
    action,
    initialState
  );

  useEffect(() => {
    if (state.status !== "idle" && state.message && showToast) {
      showToast(state.message, state.status === "success" ? "success" : "error");

      if (state.status === "success") {
        trackEvent("submit_success", "Contact", "Form");
        const form = document.getElementById("contact-form") as HTMLFormElement;
        form?.reset();
      } else if (state.status === "error") {
        trackEvent("submit_error", "Contact", state.message);
      }
    }
  }, [state, showToast]);

  return (
    <FluidContainer as="section" id="contact" className={`${styles.contact} section`}>
      <SectionHeader
        title={
          <div className={styles["contact__title-wrapper"]}>
            {data?.title || "Get in Touch"}
            <div className={styles["contact__social-links"]}>
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles["contact__social-link"]}
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        }
        subtitle={data?.subtitle || "Feel free to reach out for collaborations or just a friendly hello!"}
        align="left"
      />
      <div className={styles["contact__container"]}>
        <Box
          component="form"
          id="contact-form"
          action={formAction}
          className={styles["contact__form"]}
        >
          <div className={styles["contact__row"]}>
            <TextField
              label="Name"
              name="name"
              fullWidth
              required
              autoComplete="name"
              disabled={isPending}
              error={Boolean(state.errors?.name)}
              helperText={state.errors?.name?.[0] ?? " "}
              className={styles["contact__field"]}
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              fullWidth
              required
              disabled={isPending}
              error={Boolean(state.errors?.email)}
              helperText={state.errors?.email?.[0] ?? " "}
              className={styles["contact__field"]}
            />
          </div>

          <TextField
            label="Message"
            name="message"
            fullWidth
            required
            multiline
            minRows={5}
            disabled={isPending}
            error={Boolean(state.errors?.message)}
            helperText={state.errors?.message?.[0] ?? "Max 1000 characters"}
            slotProps={{ htmlInput: { maxLength: 1000 } }}
            className={styles["contact__field"]}
          />

          <div className={styles["contact__actions"]}>
            <SubmitButton />
          </div>
        </Box>
      </div>
    </FluidContainer>
  );
}
