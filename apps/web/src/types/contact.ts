import { z } from "zod";
import { createTranslator, type Translate } from "@/i18n/core";

export const MESSAGE_MAX_CHARS = 1000;

// ---------------------------------------------------------------------------
// Zod schema for runtime validation
// ---------------------------------------------------------------------------
/** Validation messages come from the active locale's translations. */
export function createContactSchema(t: Translate) {
    return z.object({
        name: z.string().min(1, t("contact.validation.nameRequired")),
        email: z.string().email(t("contact.validation.emailInvalid")),
        message: z
            .string()
            .min(1, t("contact.validation.messageRequired"))
            .max(MESSAGE_MAX_CHARS, t("contact.validation.messageTooLong", { max: MESSAGE_MAX_CHARS })),
    });
}

export const contactSchema = createContactSchema(createTranslator());

// ---------------------------------------------------------------------------
// Contact form types
// ---------------------------------------------------------------------------

/** Shape of a contact form submission (sent to the service layer). */
export type ContactSubmission = {
    name: string;
    email: string;
    message: string;
};

/** State managed by a contact form's server action or mutation. */
export type ContactFormState = {
    status: "idle" | "success" | "error";
    message?: string;
    errors?: {
        name?: string[];
        email?: string[];
        message?: string[];
    };
};

// ---------------------------------------------------------------------------
// Toast / notification types
// ---------------------------------------------------------------------------

export type ToastSeverity = "success" | "info" | "warning" | "error";

export interface ToastContextType {
    showToast: (message: string, severity?: ToastSeverity) => void;
}