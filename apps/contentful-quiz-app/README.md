# Contentful Quiz Custom App

This is a single deployable service: it serves the Contentful app UI and the quiz-import API from the same HTTPS URL.

## Deploy

Deploy to any Node host that supports Docker (for example, Railway, Render, Fly.io, or Cloud Run) using `apps/contentful-quiz-app/Dockerfile`.

The image depends on the root `yarn.lock` and the shared workspace packages, so the Docker build context must be the **repository root**, not this directory:

```bash
docker build -f apps/contentful-quiz-app/Dockerfile .
```

On a hosting dashboard, leave the root/source directory empty (repo root) and set the Dockerfile path to `apps/contentful-quiz-app/Dockerfile`. Pointing the root directory at `apps/contentful-quiz-app` fails with `"/yarn.lock": not found`.

Set these production variables on the host:

```text
CONTENTFUL_SPACE_ID=...
CONTENTFUL_MANAGEMENT_TOKEN=...
CONTENTFUL_ENVIRONMENT_ID=master
CONTENTFUL_LOCALE=en-US
PORT=3003
```

Do not set `VITE_BACKEND_URL` in the production build: the UI uses `/api`, so calls remain on the same secure origin.

After deployment, open the returned HTTPS URL plus `/health`; it must return `{"status":"ok"}`. In Contentful, update the app's frontend location to that base URL and install it as an entry-sidebar app only for **Component - Quiz**.

## Local development

```bash
npm run dev
```

Open the Vite URL through your existing HTTPS tunnel when configuring Contentful locally. The Vite proxy forwards `/api` to the local backend.

## Publishing workflow

1. Create a **Component - Quiz** entry and enter its title.
2. Use the Quiz builder sidebar to paste JSON and import it with publishing enabled.
3. In a **Blog Page**, select the desired Quiz in the Quiz reference field and publish the blog.
4. Deploy the web app. The blog shows the quiz after its content; after readers check answers, it shows their score and explanations.
