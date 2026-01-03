"use client";

import { useActionState } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
} from "@mui/material";
import styles from "./styles.module.scss";
import { submitContact, type ContactFormState } from "@/actions/submitContact";
import SectionHeader from "@/components/SectionHeader";

const initialState: ContactFormState = {
  status: "idle",
  message: "",
};

export default function Contact() {
  const [state, formAction, isPending] = useActionState(
    submitContact,
    initialState
  );

  return (
    <section id="contact" className={`${styles.contact} section`}>
      <Container maxWidth="lg" className="section__inner">
        <div className={styles["contact__container"]}>
          <div className={styles["contact__header"]}>
            <SectionHeader
              title={"Get in Touch"}
              subtitle={
                "Feel free to reach out for collaborations or just a friendly hello!"
              }
              align="left"
            />
          </div>

          <Box
            component="form"
            action={formAction}
            className={styles["contact__form"]}
          >
            {state.status !== "idle" && state.message && (
              <Alert
                severity={state.status === "success" ? "success" : "error"}
                className={styles["contact__alert"]}
              >
                {state.message}
              </Alert>
            )}

            <div className={styles["contact__row"]}>
              <TextField
                label="Name"
                name="name"
                fullWidth
                required
                disabled={isPending}
                className={styles["contact__field"]}
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                fullWidth
                required
                disabled={isPending}
                className={styles["contact__field"]}
              />
            </div>


            <TextField
              label="Message"
              name="message"
              fullWidth
              required
              multiline
              minRows={4}
              disabled={isPending}
              className={styles["contact__field"]}
            />

            <div className={styles["contact__actions"]}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={isPending}
              >
                {isPending ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </Box>

          <div className={styles["contact__info"]}>
            <Typography className={styles["contact__info-text"]}>
              Prefer email? Reach me at&nbsp;
              <a
                href="mailto:sehgaldival@gmail.com"
                className={styles["contact__info-link"]}
              >
                sehgaldival@gmail.com
              </a>
            </Typography>
          </div>
        </div>
      </Container>
    </section>
  );
}
