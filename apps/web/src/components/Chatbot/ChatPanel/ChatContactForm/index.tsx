"use client";

import { useEffect, useMemo, useReducer, useRef, useState, type KeyboardEvent, type SyntheticEvent } from "react";
import Button from "@dival-sehgal/ui/button";
import TextField from "@dival-sehgal/ui/text-field";
import { submitContact } from "@/actions/submit-contact";
import { MESSAGE_TEMPLATES } from "@/containers/Home/Contact/Form/constants";
import { useT } from "@/i18n/client";
import type { TranslationKey } from "@/i18n/core";
import { createContactSchema, MESSAGE_MAX_CHARS } from "@/types/contact";
import { ANALYTICS_EVENTS, trackInteraction } from "@/utils/analytics";
import { getRememberedContact, saveRememberedContact } from "@/utils/contactRemember";
import { CONTACT_FIELDS, contactFlowReducer, fieldError, initialContactFlow, type ContactField, type ContactFlowAction, type ContactFlowState } from "./contactFlow";
import styles from "./styles.module.scss";

const FIELD_INPUT: Record<ContactField, { type?: "email"; autoComplete: string; spellCheck?: boolean; maxLength?: number }> = {
  name: { autoComplete: "name" },
  email: { type: "email", autoComplete: "email", spellCheck: false },
  message: { autoComplete: "off", maxLength: MESSAGE_MAX_CHARS },
};

/**
 * The contact form, asked one field at a time inside an assistant bubble.
 * Submits through the same server action as the Home page contact form.
 */
export default function ChatContactForm() {
  const t = useT();
  const schema = useMemo(() => createContactSchema(t), [t]);
  const [state, dispatch] = useReducer(contactFlowReducer, null, () => initialContactFlow(getRememberedContact()));
  const { step, values, error } = state;
  const field = CONTACT_FIELDS.includes(step as ContactField) ? (step as ContactField) : null;
  const rootRef = useRef<HTMLDivElement>(null);

  // Each step takes focus, so the flow works from the keyboard alone.
  useEffect(() => {
    rootRef.current?.querySelector<HTMLElement>("input, textarea, [data-autofocus]")?.focus();
  }, [step]);

  const send = async () => {
    dispatch({ type: "submit" });
    const formData = new FormData();
    for (const key of CONTACT_FIELDS) {
      formData.set(key, values[key]);
    }
    try {
      const result = await submitContact({ status: "idle" }, formData);
      trackInteraction(ANALYTICS_EVENTS.CONTACT_SUBMIT, { status: result.status === "success" ? "success" : "error", message: result.message });
      if (result.status === "success") {
        saveRememberedContact({ name: values.name, email: values.email });
        dispatch({ type: "sent" });
        return;
      }
      const rejected = CONTACT_FIELDS.find((key) => result.errors?.[key]?.length);
      dispatch({ type: "failed", error: (rejected && result.errors?.[rejected]?.[0]) || result.message || t("contact.result.failed"), field: rejected });
    } catch {
      dispatch({ type: "failed", error: t("contact.result.failed") });
    }
  };

  if (step === "sent" || step === "cancelled") {
    return (
      <div ref={rootRef} className={styles["chat-contact"]}>
        <output tabIndex={-1} data-autofocus className={step === "sent" ? styles["chat-contact__success"] : styles["chat-contact__muted"]}>
          {step === "sent" ? t("contact.result.success") : t("chat.contact.cancelled")}
        </output>
      </div>
    );
  }

  const answered = CONTACT_FIELDS.filter((key) => values[key] && key !== field).length;
  const current = field ? CONTACT_FIELDS.indexOf(field) + 1 : CONTACT_FIELDS.length;

  return (
    <div ref={rootRef} className={styles["chat-contact"]}>
      <div className={styles["chat-contact__progress"]}>
        <output>{t("chat.contact.step", { current, total: CONTACT_FIELDS.length })}</output>
        <progress max={CONTACT_FIELDS.length} value={field ? answered : CONTACT_FIELDS.length} aria-hidden="true" className={styles["chat-contact__bar"]} />
      </div>

      {field ? (
        // Keyed by step so each field starts from its saved answer.
        <ContactStep key={step} field={field} initial={values[field]} error={error} schema={schema} dispatch={dispatch} />
      ) : (
        <ContactReview state={state} dispatch={dispatch} onSend={() => void send()} />
      )}
    </div>
  );
}

type ContactStepProps = {
  readonly field: ContactField;
  readonly initial: string;
  readonly error?: string;
  readonly schema: ReturnType<typeof createContactSchema>;
  readonly dispatch: (action: ContactFlowAction) => void;
};

/** One question: an input validated as you type, quick-reply templates for the message, Next / Cancel. */
function ContactStep({ field, initial, error, schema, dispatch }: ContactStepProps) {
  const t = useT();
  const [draft, setDraft] = useState(initial);
  // Live validation once there's something typed, or after a rejected attempt.
  const liveError = draft.trim() || error ? fieldError(schema, field, draft) : undefined;

  const answer = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch({ type: "answer", value: draft, error: fieldError(schema, field, draft) });
  };

  // Enter adds a newline in the message box; Ctrl/Cmd+Enter moves on.
  const submitOnModEnter = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <form onSubmit={answer} noValidate className={styles["chat-contact__step"]}>
      <TextField
        label={t(`chat.contact.ask.${field}`)}
        name={field}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={submitOnModEnter}
        error={Boolean(liveError)}
        helperText={liveError ?? (field === "message" ? `${draft.length} / ${MESSAGE_MAX_CHARS}` : undefined)}
        multiline={field === "message"}
        minRows={4}
        required
        {...FIELD_INPUT[field]}
      />
      {field === "message" && (
        <fieldset className={styles["chat-contact__chips"]} aria-label={t("contact.suggestionsLabel")}>
          {MESSAGE_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              className={styles["chat-contact__chip"]}
              onClick={() => {
                setDraft(t(template.messageKey));
                trackInteraction(ANALYTICS_EVENTS.CONTACT_TEMPLATE_SELECT, { template: template.id });
              }}
            >
              {t(template.labelKey)}
            </button>
          ))}
        </fieldset>
      )}
      <div className={styles["chat-contact__actions"]}>
        <Button type="button" variant="text" size="small" onClick={() => dispatch({ type: "cancel" })}>
          {t("chat.contact.cancel")}
        </Button>
        <Button type="submit" size="small">
          {t("chat.contact.next")}
        </Button>
      </div>
    </form>
  );
}

const SEND_LABEL: Partial<Record<ContactFlowState["step"], TranslationKey>> = { sending: "contact.sending", failed: "chat.retry" };

type ContactReviewProps = {
  readonly state: ContactFlowState;
  readonly dispatch: (action: ContactFlowAction) => void;
  readonly onSend: () => void;
};

/** The summary card: every answer with its own Edit button, then Send (or Retry after a failure). */
function ContactReview({ state: { step, values, error }, dispatch, onSend }: ContactReviewProps) {
  const t = useT();
  return (
    <div className={styles["chat-contact__step"]}>
      <p className={styles["chat-contact__muted"]}>{t("chat.contact.review")}</p>
      <dl className={styles["chat-contact__summary"]}>
        {CONTACT_FIELDS.map((key) => {
          const label = t(`contact.${key}`);
          return (
          <div key={key} className={styles["chat-contact__row"]}>
            <dt>{label}</dt>
            <dd>
              <span>{values[key]}</span>
              <button
                type="button"
                className={styles["chat-contact__chip"]}
                disabled={step === "sending"}
                aria-label={`${t("chat.contact.edit")} ${label}`}
                onClick={() => dispatch({ type: "edit", field: key })}
              >
                {t("chat.contact.edit")}
              </button>
            </dd>
          </div>
          );
        })}
      </dl>
      {step === "failed" && error && (
        <p role="alert" className={styles["chat-contact__error"]}>
          {error}
        </p>
      )}
      <div className={styles["chat-contact__actions"]}>
        <Button type="button" variant="text" size="small" disabled={step === "sending"} onClick={() => dispatch({ type: "cancel" })}>
          {t("chat.contact.cancel")}
        </Button>
        <Button type="button" size="small" data-autofocus loading={step === "sending"} onClick={onSend}>
          {t(SEND_LABEL[step] ?? "contact.send")}
        </Button>
      </div>
    </div>
  );
}
