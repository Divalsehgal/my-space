import type { TranslationKey } from "@/i18n/core";

// `id` stays in English for analytics; the label and message are translated.
export const MESSAGE_TEMPLATES: readonly { id: string; labelKey: TranslationKey; messageKey: TranslationKey }[] = [
    { id: "Job opportunity", labelKey: "contact.template.job.label", messageKey: "contact.template.job.message" },
    { id: "Freelance project", labelKey: "contact.template.freelance.label", messageKey: "contact.template.freelance.message" },
    { id: "General inquiry", labelKey: "contact.template.general.label", messageKey: "contact.template.general.message" },
    { id: "Just saying hi", labelKey: "contact.template.hello.label", messageKey: "contact.template.hello.message" },
];
