"use client";

import { useActionState, useEffect, useState } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
} from "@mui/material";
import styles from "./styles.module.scss";
import { type ContactFormState } from "@/types/contact";
import { useToast } from "@/context/ToastContext";
import SectionHeader from "@/components/SectionHeader";
import FluidContainer from "@/components/FluidContainer";
import { type PortfolioConfig } from "@/features/portfolio";
import { trackEvent } from "@/utils/analytics";

type ContactProps = Readonly<{
  data: PortfolioConfig["contact"];
  action: (prevState: ContactFormState, formData: FormData) => Promise<ContactFormState>;
}>;

const initialState: ContactFormState = {
  status: "idle",
};

export default function Contact({ data, action }: ContactProps) {
  const { showToast } = useToast();
  const [state, formAction, isPending] = useActionState(
    action,
    initialState
  );

  useEffect(() => {
    if (state.status !== "idle" && state.message) {
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
    <FluidContainer as="section" id="contact" className={`${styles.contact} section contact-section`}>
      <SectionHeader
        title={data?.title || "Get in Touch"}
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
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isPending}
              onClick={() => {
                trackEvent("click", "Contact", "Submit Button");
              }}
            >
              {isPending ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </Box>
      </div>
    </FluidContainer>
  );
}
