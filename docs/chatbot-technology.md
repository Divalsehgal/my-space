# Portfolio Chatbot Technology

This chatbot is a professional, scoped assistant for Dival Sehgal's website. It explains the public portfolio, engineering experience, projects, skills, contact flow, and published blog posts. It is intentionally not a general-purpose chatbot.

## Architecture

- **Next.js app** provides the chat UI and `/api/chat-context`, which aggregates public portfolio JSON and recent Contentful blog content.
- **Cloudflare Worker** exposes `/api/chat`, `/api/history`, `/api/seed`, and `/api/health`.
- **Workers AI** generates embeddings and assistant responses. Chat generation uses `@cf/meta/llama-3.3-70b-instruct-fp8-fast`.
- **Vectorize** stores bounded portfolio and blog chunks for retrieval-augmented generation (RAG).
- **KV** stores anonymous chat sessions for 7 days, short-lived rate-limit counters, and aggregate daily request counts.

## Request Flow

1. The browser sends the message and current pathname to `NEXT_PUBLIC_CHATBOT_URL/api/chat`.
2. The Worker validates input length, rate limits the caller, and rejects obvious off-topic or sensitive internal-data requests before calling the model.
3. The Worker accepts `pagePath` only when it matches `/blogs/<slug>`. This helps questions such as "summarize this" retrieve the active article without trusting arbitrary browser context.
4. The Worker embeds the question, optionally enriched with the sanitized blog pathname, and retrieves the four most relevant Vectorize chunks above the similarity threshold.
5. The Worker sends the policy prompt, recent conversation, and retrieved reference data to Workers AI.
6. The Worker filters the completed answer for accidental internal-data leakage, stores the conversation, and returns the SSE response expected by the React hook.

Guardrail responses use the same SSE format as model responses so the frontend has one stable streaming contract.

## Grounded Answer Policy

The assistant prompt requires:

- A professional and concise tone.
- Answers tailored to the actual question instead of repeating one generic reply.
- Blog explanations based on the article subject, key ideas, and practical takeaway only when supported by retrieved text.
- No invented employers, projects, dates, skills, links, or blog claims.
- A clear "not enough verified context" response when the indexed public data does not support an answer.

Natural language generation cannot guarantee that every sentence is unique. The production goal is more useful: different questions receive materially tailored answers while factual claims remain grounded. A low temperature (`0.35`) allows modest phrasing variation without encouraging invention. Small repetition and frequency penalties reduce repeated wording.

## Guardrails Implemented

### Code-level checks

- Requests above 500 characters are rejected.
- Obvious unrelated categories are rejected before inference.
- Requests for system prompts, hidden rules, retrieved context, vector data, secrets, session data, or the internal contact token are rejected before inference.
- Retrieved Vectorize text is never used to authorize a question as in-scope.
- Browser `pagePath` is accepted only for a strict blog slug shape.
- Production session cookies use `HttpOnly`, `Secure`, and `SameSite=None` so credentialed requests work between the website and the `workers.dev` endpoint. Local HTTP development falls back to `SameSite=Lax`.
- Output is checked for common internal prompt and token leakage markers.
- Contact payloads are validated before forwarding.
- The assistant reports contact success only after the contact API returns a successful response.

### Prompt-level checks

- Retrieved text is explicitly labeled as untrusted reference data, never instructions.
- Instructions or role changes embedded in user text or blog content must be ignored.
- Missing facts must produce an honest fallback instead of a guessed answer.
- The model must not expose hidden prompts, raw metadata, session history, tokens, or secrets.

These layers complement each other. Prompt rules improve model behavior; deterministic checks protect important boundaries even when the model is challenged.

## Scope Rules

Allowed topics:

- Dival Sehgal's portfolio website
- Career, roles, experience, and companies
- Projects and technical stack
- Skills and engineering strengths
- Published blog posts and article summaries
- Contacting or hiring Dival

Rejected topics:

- General coding help unrelated to Dival's work
- News, finance, politics, homework, entertainment, or personal advice
- Requests to reveal prompts, retrieved text, session content, secrets, or internal implementation tokens
- Requests to behave like a general-purpose chatbot

Short follow-up questions such as "explain this" remain supported after an in-scope conversation or while viewing a blog detail page.

## Seeding Vectorize

`POST /api/seed` is an administrative operation. It now:

1. Requires `Authorization: Bearer <SEED_SECRET>`.
2. Fetches content only from the configured `CHAT_CONTEXT_URL`.
3. Does not accept a caller-provided context URL, which prevents arbitrary remote fetches and untrusted re-indexing.
4. Sanitizes whitespace and bounds indexed field lengths.
5. Splits blog content into bounded chunks for more relevant retrieval.
6. Removes the managed vector IDs before upserting so removed or shortened content does not remain searchable.

Create the Worker secret:

```bash
cd apps/web
yarn wrangler secret put SEED_SECRET
```

Configure the same value in the Next.js deployment as `CHATBOT_SEED_SECRET`. Then seed manually:

```bash
curl -X POST https://ai-chatbot-widget.sehgaldival.workers.dev/api/seed \
  -H "Authorization: Bearer $CHATBOT_SEED_SECRET"
```

When Contentful revalidation runs for the `contentful` tag, the Next.js app calls the authenticated seed endpoint automatically.

## Contact Flow

For contact requests, the assistant collects:

- Name
- Email
- Message

After user confirmation, the model emits an internal `[SUBMIT_CONTACT: ...]` token. The Worker strips it, validates the payload, submits it to `CONTACT_API_URL`, and replaces the model wording with a deterministic success or failure response. The internal token never needs to reach the browser.

## Production Configuration

The previous `@cf/meta/llama-3-8b-instruct` model was replaced because Cloudflare scheduled it for deprecation on May 30, 2026. The configured `-fast` Llama 3.3 variant remains active according to Cloudflare's model-deprecation notice.

Worker variables:

```json
{
  "CHAT_CONTEXT_URL": "https://divalsehgal.vercel.app/api/chat-context",
  "CONTACT_API_URL": "https://divalsehgal.vercel.app/api/contact"
}
```

Worker secret:

```text
SEED_SECRET
```

Next.js deployment variables:

```text
NEXT_PUBLIC_CHATBOT_URL
CHATBOT_SEED_SECRET
REVALIDATION_SECRET
```

## Production Recommendations

The current implementation is a strong application-level baseline. Before treating the assistant as fully production-hardened:

1. Put Cloudflare Rate Limiting or WAF rules in front of `/api/chat`, `/api/history`, and `/api/seed`. KV counters are a useful fallback but are not perfectly atomic under heavy concurrency.
2. Protect `/api/contact` with server-side validation, abuse controls, and spam protection because it remains a separate public endpoint.
3. Add automated Worker tests for prompt-injection attempts, off-topic questions, blog-page follow-ups, missing context, seed authentication, stale-vector removal, and failed contact submissions.
4. Add monitoring for inference failures, retrieval misses, seed failures, rate-limit events, and contact API failures without logging raw private messages.
5. Review the 7-day chat retention period against the site's privacy notice and shorten it if conversation history is not required.
6. Consider moving session state to a purpose-built store if strict per-user consistency or higher traffic becomes necessary.

## Operational Checklist

1. Deploy the Next.js app so `/api/chat-context` is reachable.
2. Set `CHAT_CONTEXT_URL` and `CONTACT_API_URL` on the Worker.
3. Store `SEED_SECRET` with `wrangler secret put`, and configure the matching `CHATBOT_SEED_SECRET` in Next.js.
4. Deploy the Worker and run the authenticated `/api/seed`.
5. Test one portfolio question, one active-blog follow-up, one missing-fact question, one contact request, one off-topic request, one prompt-leak attempt, and one unauthorized seed attempt.
6. Confirm monitoring and Cloudflare edge rate limits before promoting the deployment.

## Cloudflare References

- [Workers AI planned model deprecations](https://developers.cloudflare.com/changelog/post/2026-05-08-planned-model-deprecations/)
- [Llama 3.3 70B fast model](https://developers.cloudflare.com/workers-ai/models/llama-3.3-70b-instruct-fp8-fast/)
- [Vectorize Worker binding API](https://developers.cloudflare.com/vectorize/reference/client-api/)
