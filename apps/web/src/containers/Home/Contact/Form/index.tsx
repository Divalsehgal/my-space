"use client";

import { useActionState, useEffect, use, useState } from "react";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { submitContact } from "@/actions/submit-contact";

import { ToastContext } from "@/context/ToastContext";
import { trackInteraction, ANALYTICS_EVENTS } from "@/utils/analytics";
import styles from "../styles.module.scss";

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


export default function ContactForm() {
    const [state, formAction, isPending] = useActionState(submitContact, { status: "idle" });
    const [messageLength, setMessageLength] = useState(0);

    const toastContext = use(ToastContext);
    const showToast = toastContext?.showToast;

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
                onChange={(e) => setMessageLength(e.target.value.length)}
            />

            <div className={styles["contact__actions"]}>
                <SubmitButton pending={isPending} />
            </div>
        </Box>
    );
}
