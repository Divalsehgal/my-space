import type { TranslationKey } from "@/i18n/core";
// Shared by the home contact form and the chatbot contact step, so it lives outside both.

// `id` stays in English for analytics; the label and message are translated.
export const MESSAGE_TEMPLATES: readonly { id: string; labelKey: TranslationKey; messageKey: TranslationKey }[] = [
    { id: "Job opportunity", labelKey: "contact.template.job.label", messageKey: "contact.template.job.message" },
    { id: "Freelance project", labelKey: "contact.template.freelance.label", messageKey: "contact.template.freelance.message" },
    { id: "General inquiry", labelKey: "contact.template.general.label", messageKey: "contact.template.general.message" },
    { id: "Just saying hi", labelKey: "contact.template.hello.label", messageKey: "contact.template.hello.message" },
];

/** Longest contact message accepted, shared by the forms and the server-side schema. */
export const MESSAGE_MAX_CHARS = 1000;
