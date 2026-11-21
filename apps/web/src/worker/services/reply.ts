import { MAX_CONTACTS_PER_SESSION } from "../constants/limits";
import {
    CONTACT_FAILED_REPLY,
    CONTACT_INVALID_REPLY,
    CONTACT_LIMIT_REPLY,
    CONTACT_SENT_REPLY,
    CONTACT_UNCONFIRMED_REPLY,
    FALLBACK_REPLY,
    PRIVATE_DATA_REPLY,
} from "../constants/replies";
import type { ChatSession, ContactDetails, Env } from "../types";
import { hasLeak, isContactAuthorized, stripContactToken, validateContact } from "../utils/guards";

/** Post-processing of what the model wrote: leak filter, then the contact tool (validated in code). */

async function submitContact(req: Request, env: Env, contact: ContactDetails): Promise<boolean> {
    try {
        const contactUrl = env.CONTACT_API_URL || `${new URL(req.url).origin}/api/contact`;
        const contactResponse = await fetch(contactUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contact)
        });
        return contactResponse.ok;
    } catch (e) {
        console.error('Contact submission error:', e);
        return false;
    }
}

/** Final reply from the model's raw output. Mutates `sess.contactsSent` when a message is forwarded. */
export async function postProcessReply(req: Request, env: Env, raw: string, sess: ChatSession): Promise<string> {
    const { cleaned, contact } = stripContactToken(raw || FALLBACK_REPLY);
    const full = cleaned || FALLBACK_REPLY;

    if (hasLeak(full)) {
        return PRIVATE_DATA_REPLY;
    }
    if (!contact) {
        return full;
    }

    const validatedContact = validateContact(contact);
    if (!validatedContact) {
        return CONTACT_INVALID_REPLY;
    }
    if (!isContactAuthorized(validatedContact, sess.messages)) {
        return CONTACT_UNCONFIRMED_REPLY;
    }
    if ((sess.contactsSent ?? 0) >= MAX_CONTACTS_PER_SESSION) {
        return CONTACT_LIMIT_REPLY;
    }
    if (!(await submitContact(req, env, validatedContact))) {
        return CONTACT_FAILED_REPLY;
    }
    sess.contactsSent = (sess.contactsSent ?? 0) + 1;
    return CONTACT_SENT_REPLY;
}
