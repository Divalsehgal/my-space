import { z } from "zod";

// ---------------------------------------------------------------------------
// Zod schema for runtime validation
// ---------------------------------------------------------------------------
export const contactSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Please enter a valid email address"),
    message: z.string().min(1, "Message is required").max(1000, "Message cannot exceed 1000 characters"),
});

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