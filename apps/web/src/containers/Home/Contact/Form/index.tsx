"use client";

import { useActionState, useEffect, use, useState } from "react";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { submitContact } from "@/actions/submit-contact";

import { ToastContext } from "@/context/ToastContext";
import { trackInteraction, ANALYTICS_EVENTS } from "@/utils/analytics";
import { getRememberedContact, saveRememberedContact } from "@/utils/contactRemember";
import styles from "../styles.module.scss";
import { MESSAGE_TEMPLATES } from "./constants";

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
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");

    const toastContext = use(ToastContext);
    const showToast = toastContext?.showToast;

    // Return-visitor convenience: pre-fill from whatever was remembered
    // locally after a prior successful submission. Runs post-hydration, so
    // there's no SSR/client render mismatch to guard against.
    useEffect(() => {
        const remembered = getRememberedContact();
        if (remembered) {
            setTimeout(() => {
                setName(remembered.name);
                setEmail(remembered.email);
            }, 0);
        }
    }, []);

    useEffect(() => {
        if (state.status !== "idle" && state.message && showToast) {
            showToast(state.message, state.status === "success" ? "success" : "error");

            if (state.status === "success") {
                trackInteraction(ANALYTICS_EVENTS.CONTACT_SUBMIT, { status: "success", message: state.message });
                saveRememberedContact({ name, email });
                const form = document.getElementById("contact-form") as HTMLFormElement;
                form?.reset();
                setTimeout(() => setMessage(""), 0);
            } else if (state.status === "error") {
                trackInteraction(ANALYTICS_EVENTS.CONTACT_SUBMIT, { status: "error", message: state.message });
            }
        }
    }, [state, showToast, name, email]);

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
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={Boolean(state.errors?.email)}
                    helperText={state.errors?.email?.[0] ?? " "}
                    className={styles["contact__field"]}
                />
            </div>

            <div className={styles["contact__suggestions"]}>
                <span className={styles["contact__suggestions-label"]}>Not sure what to write?</span>
                {MESSAGE_TEMPLATES.map((template) => (
                    <button
                        key={template.label}
                        type="button"
                        disabled={isPending}
                        className={styles["contact__suggestion-btn"]}
                        onClick={() => {
                            setMessage(template.message);
                            trackInteraction(ANALYTICS_EVENTS.CONTACT_TEMPLATE_SELECT, { template: template.label });
                        }}
                    >
                        {template.label}
                    </button>
                ))}
            </div>

            <TextField
                label="Message"
                name="message"
                fullWidth
                required
                multiline
                minRows={5}
                disabled={isPending}
                value={message}
                error={Boolean(state.errors?.message)}
                helperText={state.errors?.message?.[0] ?? `${message.length} / 1000`}
                slotProps={{ htmlInput: { maxLength: 1000 } }}
                className={styles["contact__field"]}
                onChange={(e) => setMessage(e.target.value)}
            />

            <div className={styles["contact__actions"]}>
                <SubmitButton pending={isPending} />
            </div>
        </Box>
    );
}
