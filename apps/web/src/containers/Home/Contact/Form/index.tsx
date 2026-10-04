"use client";

import { useActionState, useEffect, use, useState } from "react";
import clsx from "clsx";
import TextField from "@dival-sehgal/ui/text-field";
import Button from "@dival-sehgal/ui/button";
import { submitContact } from "@/actions/submit-contact";

import { ToastContext } from "@/context/ToastContext";
import { trackInteraction, ANALYTICS_EVENTS } from "@/utils/analytics";
import { getRememberedContact, saveRememberedContact } from "@/utils/contactRemember";
import styles from "./styles.module.scss";
import { MESSAGE_TEMPLATES } from "./constants";
import { useT } from "@/i18n/client";
import { MESSAGE_MAX_CHARS } from "@/types/contact";

const MESSAGE_MAX_LENGTH = MESSAGE_MAX_CHARS;

type SubmitButtonProps = {
    readonly pending: boolean;
};

export function SubmitButton({ pending }: SubmitButtonProps) {
    const t = useT();
    return (
        <Button
            type="submit"
            size="large"
            disabled={pending}
            aria-busy={pending || undefined}
            className={clsx(styles["contact-form__submit"], pending && styles["contact-form__submit--pending"])}
        >
            {t(pending ? "contact.sending" : "contact.send")}
        </Button>
    );
}


export default function ContactForm() {
    const t = useT();
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
        <form
            id="contact-form"
            action={formAction}
            className={styles["contact-form"]}
        >
            <div className={styles["contact-form__row"]}>
                <TextField
                    label={t("contact.name")}
                    name="name"
                    required
                    autoComplete="name"
                    disabled={isPending}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={Boolean(state.errors?.name)}
                    helperText={state.errors?.name?.[0] ?? " "}
                    className={styles["contact-form__field"]}
                />
                <TextField
                    label={t("contact.email")}
                    name="email"
                    type="email"
                    autoComplete="email"
                    spellCheck={false}
                    required
                    disabled={isPending}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={Boolean(state.errors?.email)}
                    helperText={state.errors?.email?.[0] ?? " "}
                    className={styles["contact-form__field"]}
                />
            </div>

            <div className={styles["contact-form__suggestions"]}>
                <span className={styles["contact-form__suggestions-label"]}>{t("contact.suggestionsLabel")}</span>
                {MESSAGE_TEMPLATES.map((template) => (
                    <button
                        key={template.id}
                        type="button"
                        disabled={isPending}
                        className={styles["contact-form__suggestion-btn"]}
                        onClick={() => {
                            setMessage(t(template.messageKey));
                            trackInteraction(ANALYTICS_EVENTS.CONTACT_TEMPLATE_SELECT, { template: template.id });
                        }}
                    >
                        {t(template.labelKey)}
                    </button>
                ))}
            </div>

            <TextField
                label={t("contact.message")}
                name="message"
                required
                multiline
                minRows={5}
                disabled={isPending}
                value={message}
                error={Boolean(state.errors?.message)}
                helperText={state.errors?.message?.[0]}
                maxLength={MESSAGE_MAX_LENGTH}
                className={styles["contact-form__field"]}
                onChange={(e) => setMessage(e.target.value)}
            />

            <div className={styles["contact-form__actions"]}>
                <span className={styles["contact-form__counter"]}>
                    {message.length} / {MESSAGE_MAX_LENGTH}
                </span>
                <SubmitButton pending={isPending} />
            </div>
        </form>
    );
}
