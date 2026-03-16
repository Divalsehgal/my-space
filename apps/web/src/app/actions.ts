"use server";

import { createContactSubmission } from "@/lib/services/notion";
import { contactSchema, type ContactFormState } from "@/types/contact";

export async function submitContact(
    prevState: ContactFormState,
    formData: FormData
): Promise<ContactFormState> {
    const name = formData.get("name")?.toString().trim() || "";
    const email = formData.get("email")?.toString().trim() || "";
    const message = formData.get("message")?.toString().trim() || "";

    const validatedFields = contactSchema.safeParse({ name, email, message });

    if (!validatedFields.success) {
        return {
            status: "error",
            message: "Please fix the errors in the form.",
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        await createContactSubmission({ name, email, message });

        return {
            status: "success",
            message: "Thanks for reaching out! I'll get back to you soon.",
        };
    } catch (err) {
        console.error("Contact form error", err);
        return {
            status: "error",
            message: "Something went wrong. Please try again in a moment.",
        };
    }
}
