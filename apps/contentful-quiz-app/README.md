# Contentful Quiz Custom App

An entry-sidebar app for **Component - Quiz** entries: paste quiz JSON and it creates the questions and options in Contentful and attaches them to the quiz.

- **UI** (this folder): a Vite + React bundle hosted by Contentful (app hosting), so it loads instantly with no server to wake up.
- **API**: the Vercel function `apps/web/src/app/api/contentful/create-quiz-questions/route.ts`. It only accepts requests signed by this app (Contentful signed requests), because it creates and publishes content with a management token.

## One-time setup

1. **Signing secret.** In Contentful go to *Apps → Manage app definitions → this app → Security*, enable request verification and copy the 64-character signing secret.
2. **Vercel environment variables** (production) for the web app:

   ```text
   CONTENTFUL_MANAGEMENT_TOKEN=...
   CONTENTFUL_APP_SIGNING_SECRET=...   # from step 1
   CONTENTFUL_LOCALE=en-US             # optional
   ```

   `CONTENTFUL_SPACE_ID` is the one the site already uses; `CONTENTFUL_ENVIRONMENT_ID` defaults to `master`.
3. **Build and upload the UI** to Contentful app hosting:

   ```bash
   VITE_BACKEND_URL=https://divalsehgal.vercel.app/api yarn workspace contentful-quiz-app build
   yarn workspace contentful-quiz-app upload
   ```

   The upload asks for your organization, the app definition and a management token, then makes the new bundle live. Re-run both commands whenever the UI changes.

Install the app as an entry-sidebar app only for **Component - Quiz**.

## Local development

Run the web app (`yarn workspace web dev`, port 3000) with the variables above in `apps/web/.env.local`, then:

```bash
yarn workspace contentful-quiz-app dev
```

Point the app definition's frontend at the Vite URL through your HTTPS tunnel. Vite proxies `/api` to the Next dev server on port 3000.

## Content-model scripts

`sync:content-model` and `migrate:quiz-content` read `CONTENTFUL_SPACE_ID`, `CONTENTFUL_MANAGEMENT_TOKEN` and `CONTENTFUL_ENVIRONMENT_ID` from this folder's `.env`.

## Publishing workflow

1. Create a **Component - Quiz** entry and enter its title.
2. Use the Quiz builder sidebar to paste JSON and import it with publishing enabled.
3. In a **Blog Page**, select the desired Quiz in the Quiz reference field and publish the blog.
4. Deploy the web app. The blog shows the quiz after its content; after readers check answers, it shows their score and explanations.
