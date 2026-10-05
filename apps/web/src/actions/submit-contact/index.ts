"use server";

import { createContactSubmission } from "../../lib/services/notion";
import { createContactSchema, type ContactFormState } from "../../types/contact";
import { z } from "zod";
import { getT } from "@/i18n/server";

/** A trimmed text field; a missing field or a file upload reads as "". */
function textField(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
}

export async function submitContact(
    _prevState: ContactFormState,
    formData: FormData
): Promise<ContactFormState> {


    const name = textField(formData, "name");
    const email = textField(formData, "email");
    const message = textField(formData, "message");

    const t = getT();
    const validatedFields = createContactSchema(t).safeParse({ name, email, message });

    if (!validatedFields.success) {
        return {
            status: "error",
            message: t("contact.result.invalid"),
            errors: z.flattenError(validatedFields.error).fieldErrors,
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
