"use client";

import React from "react";
import { TextField, Box, Button } from "@mui/material";
import { type ContactFormState } from "@/types/contact";
import styles from "./styles.module.scss";

type SubmitButtonProps = {
  readonly pending: boolean;
};

export function SubmitButton({ pending }: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      variant="contained"
      size="large"
      fullWidth
      disabled={pending}
    >
      {pending ? "Sending..." : "Send Message"}
    </Button>
  );
}

type ContactFormProps = {
  readonly formAction: (formData: FormData) => void;
  readonly isPending: boolean;
  readonly state: ContactFormState;
  readonly messageLength: number;
  readonly onMessageChange: (length: number) => void;
};

export default function ContactForm({
  formAction,
  isPending,
  state,
  messageLength,
  onMessageChange,
}: ContactFormProps) {
  return (
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
        helperText={state.errors?.message?.[0] ?? `${messageLength} / 1000`}
        slotProps={{ htmlInput: { maxLength: 1000 } }}
        className={styles["contact__field"]}
        onChange={(e) => onMessageChange(e.target.value.length)}
      />

      <div className={styles["contact__actions"]}>
        <SubmitButton pending={isPending} />
      </div>
    </Box>
  );
}
