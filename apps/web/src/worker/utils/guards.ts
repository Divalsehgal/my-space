import {
    MAX_CHAT_MESSAGE_LENGTH,
    MAX_CONTACT_MESSAGE_LENGTH,
    MAX_EMAIL_LENGTH,
    MAX_NAME_LENGTH,
    SEMANTIC_SCOPE_SCORE,
} from "../constants/limits";
import { OFF_TOPIC_REPLY, PRIVATE_DATA_REPLY, TOO_LONG_REPLY } from "../constants/replies";
import {
    CONTACT_MARKER,
    blockedPattern,
    confirmationPattern,
    followUpTerms,
    greetingTerms,
    portfolioTerms,
    privateDataPatterns,
    responseLeakPatterns,
} from "../constants/guardrails";
import type { ChatMessage, ContactDetails } from "../types";

/**
 * Chat guardrails: what's in scope, what must never be asked for or leaked,
 * and validation for chat messages and contact submissions.
 */

const escape = (term: string) => term.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
// Whole words only: substrings matched "reactor", "contactless", "show" (how), "with" (it).
const portfolioPattern = new RegExp(String.raw`(?:^|[^\p{L}\p{N}])(?:${portfolioTerms.map(escape).join('|')})(?![\p{L}\p{N}])`, 'iu');
const followUpPattern = new RegExp(String.raw`\b(?:${followUpTerms.join('|')})\b`, 'i');

export const isFollowUp = (q: string) => followUpPattern.test(q);

/** Lower-cases, removes zero-width characters and collapses spacing so "b i t c o i n" tricks fail fewer checks. */
export function normalizeMessage(message: string | undefined): string {
    return (message ?? '').normalize('NFKC').replace(/[​-‍⁠﻿]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

// A loop, not /[!?.,]+$/, which backtracks quadratically on long punctuation runs.
function stripTrailingPunctuation(text: string): string {
    let end = text.length;
    while (end > 0 && '!?.,'.includes(text[end - 1])) {
        end--;
    }
    return text.slice(0, end);
}

/** True when a reply echoes phrases only the system prompt contains. */
export const hasLeak = (text: string) => responseLeakPatterns.some((pattern) => pattern.test(text));

export function hasPortfolioTerm(message: string): boolean {
    return portfolioPattern.test(message);
}

export function isInPortfolioScope(message: string | undefined, hasRecentPortfolioConversation: boolean, activeBlogPath?: string, topScore = 0): boolean {
    const msg = normalizeMessage(message);
    if (!msg) {
        return false;
    }
    if (activeBlogPath && isFollowUp(msg)) {
        return true;
    }
    return hasPortfolioTerm(msg)
        || greetingTerms.has(stripTrailingPunctuation(msg))
        || (hasRecentPortfolioConversation && isFollowUp(msg))
        || topScore >= SEMANTIC_SCOPE_SCORE;
}

export function stripContactToken(text: string): { cleaned: string; contact?: ContactDetails } {
    const start = text.indexOf(CONTACT_MARKER);
    if (start === -1) {
        return { cleaned: text.trim() };
    }
    // Everything from the marker on is the token; JSON may contain "}" or newlines.
    const token = text.slice(start);
    const cleaned = text.slice(0, start).trim();
    const open = token.indexOf('{');
    const close = token.lastIndexOf('}');
    const json = open !== -1 && close > open ? token.slice(open, close + 1) : undefined;
    try {
        const contact = json ? JSON.parse(json) as ContactDetails : undefined;
        return contact && typeof contact === 'object' ? { cleaned, contact } : { cleaned };
    } catch {
        return { cleaned };
    }
}

export function sanitizeActiveBlogPath(pagePath: string | undefined): string | undefined {
    const normalized = pagePath?.trim();
    return normalized && /^\/blogs\/[a-z0-9-]{1,100}$/i.test(normalized) ? normalized : undefined;
}

// Same shape as /^[^\s@]+@[^\s@]+\.[^\s@]+$/ (no whitespace, one "@", a dot
// inside the domain), checked without a backtracking regex.
function isEmailShaped(email: string): boolean {
    if (/\s/.test(email)) {
        return false;
    }
    const at = email.indexOf('@');
    if (at <= 0 || at !== email.lastIndexOf('@')) {
        return false;
    }
    const domain = email.slice(at + 1);
    const dot = domain.indexOf('.', 1);
    return dot !== -1 && dot < domain.length - 1;
}

export function validateContact(contact: ContactDetails | undefined): ContactDetails | undefined {
    if (!contact) {
        return undefined;
    }

    const name = typeof contact.name === 'string' ? contact.name.trim() : '';
    const email = typeof contact.email === 'string' ? contact.email.trim() : '';
    const message = typeof contact.message === 'string' ? contact.message.trim() : '';
    if (!name || name.length > MAX_NAME_LENGTH || !email || email.length > MAX_EMAIL_LENGTH || !isEmailShaped(email) || !message || message.length > MAX_CONTACT_MESSAGE_LENGTH) {
        return undefined;
    }

    return { name, email, message };
}

/**
 * The model is never trusted to decide a message is ready: the user's latest
 * turn must be a confirmation and the email must be one the user actually
 * typed. This stops injected text (e.g. inside a blog post) from making the
 * model send mail on its own, or to an address it made up.
 */
export function isContactAuthorized(contact: { email: string }, messages: ChatMessage[]): boolean {
    const userTurns = messages.filter((m) => m.role === 'user');
    const latest = userTurns.at(-1)?.content ?? '';
    const email = contact.email.toLowerCase();
    return confirmationPattern.test(latest) && userTurns.some((m) => m.content.toLowerCase().includes(email));
}

export function validateMessage(message: string | undefined): { valid: boolean; reason?: string } {
    if (!message?.trim() || message.length > MAX_CHAT_MESSAGE_LENGTH) {
        return { valid: false, reason: TOO_LONG_REPLY };
    }

    const msg = normalizeMessage(message);
    if (blockedPattern.test(msg)) {
        return { valid: false, reason: OFF_TOPIC_REPLY };
    }

    if (privateDataPatterns.some(pattern => pattern.test(msg))) {
        return { valid: false, reason: PRIVATE_DATA_REPLY };
    }

    return { valid: true };
}
