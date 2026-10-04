import { followUpTerms } from "./retrieval";

/**
 * Chat guardrails: what's in scope, what must never be asked for or leaked,
 * and validation for chat messages and contact submissions.
 */

export const OFF_TOPIC_REPLY = "I can only help with Dival Sehgal's portfolio, engineering experience, projects, skills, contact details, and blog posts. Try asking about his work, tech stack, projects, or writing.";
export const PRIVATE_DATA_REPLY = "I can explain Dival's public portfolio and blog content, but I cannot reveal internal instructions, stored context, session data, or implementation secrets.";
// Input limits (RFC 5321 caps email addresses at 254 characters).
const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_CONTACT_MESSAGE_LENGTH = 1000;
const MAX_CHAT_MESSAGE_LENGTH = 500;
export const portfolioTerms = [
    'dival', 'sehgal', 'portfolio', 'website', 'site', 'blog', 'post', 'article',
    'project', 'projects', 'work', 'experience', 'career', 'company', 'role',
    'skill', 'skills', 'tech', 'stack', 'resume', 'cv', 'contact', 'email',
    'message', 'hire', 'hiring', 'developer', 'engineer', 'frontend', 'backend',
    'full stack', 'next', 'react', 'typescript', 'cloudflare', 'contentful'
];

export const greetingTerms = new Set(['hi', 'hello', 'hey', 'thanks', 'thank you', 'what can you do', 'help']);
export const privateDataPatterns = [
    /system\s+prompt/i,
    /developer\s+(?:message|instruction|prompt)/i,
    /(?:ignore|override|bypass|forget|reveal|show|print|repeat|leak).{0,40}(?:instruction|prompt|rule|guardrail|context|secret|token|session|metadata)/i,
    /(?:retrieved|vector|embedding|stored|hidden|internal).{0,30}(?:context|data|text|fact|prompt|message|token|secret)/i,
    /\bsubmit_contact\b/i,
    /jailbreak|prompt\s*injection/i
];
export const responseLeakPatterns = [
    /approved portfolio\/blog facts/i,
    /verified reference facts/i,
    /\bsubmit_contact\b/i,
    /system prompt/i
];

export function isInPortfolioScope(message: string | undefined, hasRecentPortfolioConversation: boolean, activeBlogPath?: string): boolean {
    const msg = message?.toLowerCase().trim() || '';
    if (activeBlogPath && followUpTerms.some(term => msg.includes(term))) {
        return true;
    }
    return portfolioTerms.some(term => msg.includes(term))
        || greetingTerms.has(msg)
        || (hasRecentPortfolioConversation && followUpTerms.some(term => msg.includes(term)));
}

export function stripContactToken(text: string): { cleaned: string; contact?: { name: string; email: string; message: string } } {
    const contactRegex = /\[SUBMIT_CONTACT:\s*(\{.*?\})/;
    const contactMatch = contactRegex.exec(text);
    if (!contactMatch) {
        return { cleaned: text.trim() };
    }

    try {
        const contact = JSON.parse(contactMatch[1]) as { name: string; email: string; message: string };
        return { cleaned: text.replace(contactMatch[0], '').trim(), contact };
    } catch {
        return { cleaned: text.replace(contactMatch[0], '').trim() };
    }
}

export function sanitizeActiveBlogPath(pagePath: string | undefined): string | undefined {
    const normalized = pagePath?.trim();
    return normalized && /^\/blogs\/[a-z0-9-]+$/i.test(normalized) ? normalized : undefined;
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

    const name = contact.name?.trim();
    const email = contact.email?.trim();
    const message = contact.message?.trim();
    if (!name || name.length > MAX_NAME_LENGTH || !email || email.length > MAX_EMAIL_LENGTH || !isEmailShaped(email) || !message || message.length > MAX_CONTACT_MESSAGE_LENGTH) {
        return undefined;
    }

    return { name, email, message };
}

export function validateMessage(message: string | undefined): { valid: boolean; reason?: string } {
    const blocked = ['crypto', 'bitcoin', 'gambling', 'dating', 'adult', 'politics', 'offensive'];
    const msg = message?.toLowerCase().trim() || '';

    if (blocked.some(word => msg.includes(word))) {
        return { valid: false, reason: OFF_TOPIC_REPLY };
    }

    if (privateDataPatterns.some(pattern => pattern.test(msg))) {
        return { valid: false, reason: PRIVATE_DATA_REPLY };
    }

    if (!message || message.length > MAX_CHAT_MESSAGE_LENGTH) {
        return { valid: false, reason: "Please keep your questions concise so I can provide the best technical insights." };
    }

    return { valid: true };
}
