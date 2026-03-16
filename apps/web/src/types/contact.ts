import { z } from "zod";

export const contactSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Please enter a valid email address"),
    message: z.string().min(1, "Message is required").max(1000, "Message cannot exceed 1000 characters"),
});

export type ContactFormState = {
    status: "idle" | "success" | "error";
    message?: string;
    errors?: {
        name?: string[];
        email?: string[];
        message?: string[];
    };
};
