"use server";

export type ContactFormState = {
    status: "idle" | "success" | "error";
    message?: string;
};

export async function submitContact(
    prevState: ContactFormState,
    formData: FormData
): Promise<ContactFormState> {
    // Read form fields
    const name = formData.get("name")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const subject = formData.get("subject")?.toString().trim();
    const message = formData.get("message")?.toString().trim();

    // Very basic validation
    if (!name || !email || !message) {
        return {
            status: "error",
            message: "Please fill in your name, email, and message.",
        };
    }

    try {
        // TODO: plug this into your real side-effect:
        // - send email
        // - write to database
        // - push to Notion/Slack, etc.
        console.info("Contact form submission", { name, email, subject, message });

        // Simulate small delay
        await new Promise((r) => setTimeout(r, 400));

        return {
            status: "success",
            message: "Thanks for reaching out! I’ll get back to you soon.",
        };
    } catch (err) {
        console.error("Contact form error", err);
        return {
            status: "error",
            message: "Something went wrong. Please try again in a moment.",
        };
    }
}
