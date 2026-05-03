"use server";

import { headers } from "next/headers";
import { createContactSubmission } from "../../lib/services/notion";
import { contactSchema, type ContactFormState } from "../../types/contact";

// Simple in-memory rate limiter (resets on server restart, good enough for simple protection)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3;

export async function submitContact(
    _prevState: ContactFormState,
    formData: FormData
): Promise<ContactFormState> {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown_ip";
    
    const now = Date.now();
    const rateLimitInfo = rateLimitMap.get(ip) || { count: 0, lastReset: now };

    if (now - rateLimitInfo.lastReset > RATE_LIMIT_WINDOW_MS) {
        rateLimitInfo.count = 1;
        rateLimitInfo.lastReset = now;
    } else {
        rateLimitInfo.count += 1;
        if (rateLimitInfo.count > MAX_REQUESTS_PER_WINDOW) {
            return {
                status: "error",
                message: "Too many requests. Please try again later.",
            };
        }
    }
    rateLimitMap.set(ip, rateLimitInfo);

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
