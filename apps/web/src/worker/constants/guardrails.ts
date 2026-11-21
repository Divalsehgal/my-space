/** Word lists and patterns the guardrails (utils/guards.ts) match messages and replies against. */

export const portfolioTerms = [
    'dival', 'sehgal', 'he', 'his', 'him', 'portfolio', 'website', 'site', 'blog', 'blogs', 'post', 'posts', 'article', 'articles',
    'project', 'projects', 'work', 'worked', 'experience', 'career', 'company', 'companies', 'role', 'job',
    'skill', 'skills', 'tech', 'stack', 'resume', 'cv', 'contact', 'email',
    'message', 'hire', 'hiring', 'developer', 'engineer', 'frontend', 'backend',
    'full stack', 'next.js', 'nextjs', 'react', 'typescript', 'cloudflare', 'contentful'
];

export const greetingTerms = new Set(['hi', 'hello', 'hey', 'thanks', 'thank you', 'what can you do', 'help', 'good morning', 'good evening']);

// Ambiguous, short, or pronoun-heavy messages ("tell me more", "why?") retrieve
// poorly on their own, so their query is enriched with the prior user turn.
export const followUpTerms = ['it', 'that', 'this', 'more', 'explain', 'summarize', 'summary', 'why', 'how'];

export const blockedPattern = /\b(?:crypto(?:currency|currencies)?|bitcoin|gambling|casino|betting|dating|porn|nsfw|adult content|politics|political|offensive)\b/i;

export const privateDataPatterns = [
    /system\s+prompt/i,
    /developer\s+(?:message|instruction|prompt)/i,
    // Injection verbs aimed at the assistant's rules.
    /(?:ignore|override|bypass|forget|disregard).{0,40}(?:instruction|prompt|rule|guardrail)/i,
    // Extraction verbs aimed at hidden material ("show your context", not "show the design tokens post").
    /(?:reveal|show|print|repeat|leak|dump|output|tell me).{0,20}(?:your|the|system|hidden)\s+(?:instruction|prompt|rule|guardrail|context|secret|session|metadata)/i,
    /(?:reveal|show|print|repeat|leak|dump|output|tell me).{0,20}(?:internal|initial|original|previous|above)\s+(?:instruction|prompt|rule|guardrail|context|secret|session|metadata)/i,
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

export const confirmationPattern = /\b(?:yes|yep|yeah|yup|sure|ok|okay|confirm(?:ed)?|correct|send(?: it)?|submit|go ahead|looks good|do it)\b/i;

/** Start of the internal tool token the model emits to send a contact message. */
export const CONTACT_MARKER = '[SUBMIT_CONTACT';
