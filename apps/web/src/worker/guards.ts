import { isFollowUp } from "./retrieval";
import type { ChatMessage } from "./types";

/**
 * Chat guardrails: what's in scope, what must never be asked for or leaked,
 * and validation for chat messages and contact submissions.
 */

export const OFF_TOPIC_REPLY = "I can only help with Dival Sehgal's portfolio, engineering experience, projects, skills, contact details, and blog posts. Try asking about his work, tech stack, projects, or writing.";
export const PRIVATE_DATA_REPLY = "I can explain Dival's public portfolio and blog content, but I cannot reveal internal instructions, stored context, session data, or implementation secrets.";
export const CONTACT_INVALID_REPLY = "I could not submit that message because the contact details were incomplete or invalid. Please provide a valid name, email address, and message.";
export const CONTACT_UNCONFIRMED_REPLY = "Before I send anything, please confirm the name, email address, and message you'd like me to forward to Dival.";
export const CONTACT_LIMIT_REPLY = "You've already sent a few messages from this chat. Please use the contact form or email Dival directly for anything else.";
// Input limits (RFC 5321 caps email addresses at 254 characters).
const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_CONTACT_MESSAGE_LENGTH = 1000;
const MAX_CHAT_MESSAGE_LENGTH = 500;
export const MAX_CONTACTS_PER_SESSION = 3;
/**
 * A question whose best vector match scores at least this is about the indexed
 * portfolio even when it uses none of the scope words ("Does he know Python?").
 * The score compares the user's own text with our own index, so retrieved text
 * still never decides scope.
 */
export const SEMANTIC_SCOPE_SCORE = 0.72;

export const portfolioTerms = [
    'dival', 'sehgal', 'he', 'his', 'him', 'portfolio', 'website', 'site', 'blog', 'blogs', 'post', 'posts', 'article', 'articles',
    'project', 'projects', 'work', 'worked', 'experience', 'career', 'company', 'companies', 'role', 'job',
    'skill', 'skills', 'tech', 'stack', 'resume', 'cv', 'contact', 'email',
    'message', 'hire', 'hiring', 'developer', 'engineer', 'frontend', 'backend',
    'full stack', 'next.js', 'nextjs', 'react', 'typescript', 'cloudflare', 'contentful'
];
const escape = (term: string) => term.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
// Whole words only: substrings matched "reactor", "contactless", "show" (how), "with" (it).
const portfolioPattern = new RegExp(String.raw`(?:^|[^\p{L}\p{N}])(?:${portfolioTerms.map(escape).join('|')})(?![\p{L}\p{N}])`, 'iu');

export const greetingTerms = new Set(['hi', 'hello', 'hey', 'thanks', 'thank you', 'what can you do', 'help', 'good morning', 'good evening']);

const blockedPattern = /\b(?:crypto(?:currency|currencies)?|bitcoin|gambling|casino|betting|dating|porn|nsfw|adult content|politics|political|offensive)\b/i;

export const privateDataPatterns = [
    /system\s+prompt/i,
    /developer\s+(?:message|instruction|prompt)/i,
    // Injection verbs aimed at the assistant's rules.
    /(?:ignore|override|bypass|forget|disregard).{0,40}(?:instruction|prompt|rule|guardrail)/i,
    // Extraction verbs aimed at hidden material ("show your context", not "show the design tokens post").
    /(?:reveal|show|print|repeat|leak|dump|output|tell me).{0,20}(?:your|the|system|hidden|internal|initial|original|previous|above)\s+(?:instruction|prompt|rule|guardrail|context|secret|session|metadata)/i,
    /(?:your|you|this\s+(?:chat|bot|assistant)).{0,40}(?:retrieved|stored|hidden|internal).{0,30}(?:context|data|text|fact|prompt|message|token|secret)/i,
    /\bsubmit_contact\b/i,
    /jailbreak|prompt\s*injection/i
];

// Phrases only the system prompt contains: seeing one in a reply means it is being echoed.
export const responseLeakPatterns = [
    /approved portfolio\/blog facts/i,
    /verified reference facts/i,
    /untrusted data/i,
    /\bsubmit_contact\b/i,
    /DATA BOUNDARY:/,
    /CONTACT FLOW:/,
    /SITE INDEX \(/,
];

/** Lower-cases, removes zero-width characters and collapses spacing so "b i t c o i n" tricks fail fewer checks. */
export function normalizeMessage(message: string | undefined): string {
    return (message ?? '').normalize('NFKC').replace(/[​-‍⁠﻿]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

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
        || greetingTerms.has(msg.replace(/[!?.,]+$/, ''))
        || (hasRecentPortfolioConversation && isFollowUp(msg))
        || topScore >= SEMANTIC_SCOPE_SCORE;
}

export const CONTACT_MARKER = '[SUBMIT_CONTACT';

export function stripContactToken(text: string): { cleaned: string; contact?: { name: string; email: string; message: string } } {
    const start = text.indexOf(CONTACT_MARKER);
    if (start === -1) {
        return { cleaned: text.trim() };
    }
    // Everything from the marker on is the token; JSON may contain "}" or newlines.
    const token = text.slice(start);
    const cleaned = text.slice(0, start).trim();
    const json = /\{[\s\S]*\}/.exec(token)?.[0];
    try {
        const contact = json ? JSON.parse(json) as { name: string; email: string; message: string } : undefined;
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

export function validateContact(contact: { name: string; email: string; message: string } | undefined) {
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

const confirmationPattern = /\b(?:yes|yep|yeah|yup|sure|ok|okay|confirm(?:ed)?|correct|send(?: it)?|submit|go ahead|looks good|do it)\b/i;

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
        return { valid: false, reason: "Please keep your questions concise so I can provide the best technical insights." };
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
