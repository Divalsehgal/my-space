"use server";

import { createContactSubmission } from "../../lib/services/notion";
import { createContactSchema, type ContactFormState } from "../../types/contact";
import { getT } from "@/i18n/server";
export async function submitContact(
    _prevState: ContactFormState,
    formData: FormData
): Promise<ContactFormState> {


    const name = formData.get("name")?.toString().trim() || "";
    const email = formData.get("email")?.toString().trim() || "";
    const message = formData.get("message")?.toString().trim() || "";

    const t = getT();
    const validatedFields = createContactSchema(t).safeParse({ name, email, message });

    if (!validatedFields.success) {
        return {
            status: "error",
            message: t("contact.result.invalid"),
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        await createContactSubmission({ name, email, message });

        return {
            status: "success",
            message: t("contact.result.success"),
        };
    } catch (err) {
        console.error("Contact form error", err);
        return {
            status: "error",
            message: t("contact.result.failed"),
        };
    }
}
