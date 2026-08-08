import { NextResponse } from 'next/server';
import { createContactSubmission } from '@/lib/services/notion';

export const runtime = 'nodejs';

// Linear (non-backtracking) email shape check. Kept intentionally permissive:
// we only guard against obviously malformed values, not deliverability.
function isValidEmail(email: string): boolean {
    if (/\s/.test(email)) { return false; }
    const at = email.indexOf('@');
    if (at <= 0 || at !== email.lastIndexOf('@')) { return false; }
    const domain = email.slice(at + 1);
    return domain.length >= 3 && domain.includes('.') && !domain.startsWith('.') && !domain.endsWith('.');
}

const LIMITS = {
    name: 120,
    email: 254,
    message: 5000,
} as const;

interface ContactFields {
    name: string;
    email: string;
    message: string;
}

// Validates the raw request body and returns either the sanitized fields or an
// error message. Kept separate from POST to keep the handler's complexity low.
function validateContactBody(body: unknown): { fields: ContactFields } | { error: string } {
    const { name, email, message } = (body ?? {}) as Record<string, unknown>;

    if (!name || !email || !message) {
        return { error: 'Missing required fields (name, email, message)' };
    }

    if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
        return { error: 'Invalid field types' };
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
        return { error: 'Missing required fields (name, email, message)' };
    }

    if (
        trimmedName.length > LIMITS.name ||
        trimmedEmail.length > LIMITS.email ||
        trimmedMessage.length > LIMITS.message
    ) {
        return { error: 'One or more fields exceed the allowed length' };
    }

    if (!isValidEmail(trimmedEmail)) {
        return { error: 'Invalid email address' };
    }

    return { fields: { name: trimmedName, email: trimmedEmail, message: trimmedMessage } };
}

export async function POST(req: Request) {
    try {
        const result = validateContactBody(await req.json());

        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        await createContactSubmission(result.fields);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Contact API error:', error);
        return NextResponse.json({ error: 'Failed to submit contact request to Notion' }, { status: 500 });
    }
}
