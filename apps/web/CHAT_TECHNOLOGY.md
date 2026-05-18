# Portfolio Chatbot Technology

This chatbot is a scoped portfolio assistant for Dival Sehgal's website. It should answer only about the portfolio, Dival's engineering experience, projects, skills, contact flow, and blog posts.

## Architecture

- **Next.js app** provides the website UI and `/api/chat-context`, which combines portfolio JSON and recent blog content into one context payload.
- **Cloudflare Worker** exposes `/api/chat`, `/api/history`, `/api/seed`, and `/api/health`.
- **Workers AI** generates embeddings and assistant responses.
- **Vectorize** stores portfolio/blog chunks for retrieval-augmented generation.
- **KV** stores anonymous chat sessions for 30 days.

## Request Flow

1. The browser sends messages to `NEXT_PUBLIC_CHATBOT_URL/api/chat`.
2. The Worker validates the message and rejects clearly off-topic requests before calling the model.
3. The Worker embeds the question and searches Vectorize for approved portfolio/blog facts.
4. If the question is in scope, the Worker sends the system prompt, recent session messages, and retrieved facts to Workers AI.
5. The Worker streams an SSE-shaped response back to the React hook.

Guardrail responses also use the same SSE format. This is important because the frontend chat hook reads every `/api/chat` response as a stream.

## Scope Rules

Allowed topics:

- Dival Sehgal's portfolio website
- Career, roles, experience, and companies
- Projects and technical stack
- Skills and engineering strengths
- Blog posts and article summaries
- Contacting or hiring Dival

Rejected topics:

- General coding help unrelated to Dival's work
- News, finance, politics, homework, entertainment, or personal advice
- Anything asking the assistant to behave like a general-purpose chatbot

The model is also instructed to use only retrieved facts and recent conversation. If the data is missing, it should say it does not have that detail rather than inventing an answer.

## Seeding Vectorize

The seed endpoint must read context from the Next.js app, not from the Worker itself.

Use one of these options:

```bash
curl -X POST https://ai-chatbot-widget.sehgaldival.workers.dev/api/seed \
  -H "Content-Type: application/json" \
  -d '{"contextUrl":"https://divalsehgal.vercel.app/api/chat-context"}'
```

Or configure the Worker variable:

```json
{
  "CHAT_CONTEXT_URL": "https://divalsehgal.vercel.app/api/chat-context"
}
```

When Contentful revalidation runs for the `contentful` tag, the Next.js app now calls `/api/seed` with the correct `contextUrl` automatically.

## Contact Flow

For contact requests, the assistant collects:

- Name
- Email
- Message

After confirmation, the model emits an internal `[SUBMIT_CONTACT: ...]` token. The Worker strips that token before the response reaches the UI, then submits the payload to `CONTACT_API_URL`.

Production Worker variables should include:

```json
{
  "CHAT_CONTEXT_URL": "https://divalsehgal.vercel.app/api/chat-context",
  "CONTACT_API_URL": "https://divalsehgal.vercel.app/api/contact"
}
```

## UI Notes

- The chat widget is fixed at the bottom-right with a higher layer than nearby floating controls.
- On small mobile screens, the scroll-to-top control moves to the bottom-left so it does not overlap the chat button.
- The chat window uses viewport-aware height, safe-area spacing, and message word wrapping to keep long answers usable on mobile.

## Operational Checklist

1. Deploy the Next.js app so `/api/chat-context` is reachable.
2. Deploy the Worker with `CHAT_CONTEXT_URL` and `CONTACT_API_URL`.
3. Run `/api/seed` after portfolio or blog updates.
4. Test one in-scope question, one blog question, one contact request, and one off-topic request.
5. Confirm off-topic requests receive a short portfolio-only refusal.
