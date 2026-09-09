import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || process.env.BACKEND_PORT || 3003;
const defaultLocale = process.env.CONTENTFUL_LOCALE || 'en-US';
const distPath = path.resolve(__dirname, '../dist');

app.use(express.json({ limit: '2mb' }));

const getContentfulConfig = () => {
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const accessToken = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
  const environmentId = process.env.CONTENTFUL_ENVIRONMENT_ID || 'master';

  if (!spaceId || !accessToken) {
    throw new Error('Missing CONTENTFUL_SPACE_ID or CONTENTFUL_MANAGEMENT_TOKEN in apps/contentful-quiz-app/.env.');
  }

  return { spaceId, accessToken, environmentId };
};

const createRichText = (text) => ({
  nodeType: 'document',
  data: {},
  content: [{
    nodeType: 'paragraph',
    data: {},
    content: [{ nodeType: 'text', value: text, marks: [], data: {} }],
  }],
});

const createEntryLink = (id) => ({
  sys: { type: 'Link', linkType: 'Entry', id },
});

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const shortId = () => crypto.randomUUID().slice(0, 8);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Contentful's Management API allows ~7 requests/second on this space. Every
// request is funneled through this chain so calls never fire in parallel
// bursts, which is what was triggering "too many requests" errors whenever
// more than one question was generated at a time.
const MIN_REQUEST_INTERVAL_MS = 200;
let requestChain = Promise.resolve();

function paced(fn) {
  const run = requestChain.then(async () => {
    try {
      return await fn();
    } finally {
      await sleep(MIN_REQUEST_INTERVAL_MS);
    }
  });
  // Keep the chain alive even if this call fails, so later calls still pace correctly.
  requestChain = run.then(() => undefined, () => undefined);
  return run;
}

function validateQuestions(questions) {
  if (!Array.isArray(questions) || questions.length === 0) {
    return ['Add at least one question.'];
  }

  const errors = [];
  questions.forEach((question, index) => {
    const label = `Question ${index + 1}`;
    if (!isNonEmptyString(question?.questionText)) errors.push(`${label} needs questionText.`);
    if (!isNonEmptyString(question?.explanation)) errors.push(`${label} needs an explanation.`);
    if (!Array.isArray(question?.options) || question.options.length !== 4) {
      errors.push(`${label} must contain exactly four options.`);
      return;
    }

    const optionTexts = question.options.map((option) => option?.text?.trim().toLowerCase());
    if (optionTexts.some((text) => !text)) errors.push(`${label} has an empty option.`);
    if (new Set(optionTexts).size !== optionTexts.length) errors.push(`${label} has duplicate option text.`);
    if (question.options.filter((option) => option?.isCorrect === true).length !== 1) {
      errors.push(`${label} must have exactly one correct option.`);
    }
  });

  return errors;
}

const MAX_RETRIES = 5;

async function contentfulRequest(config, urlPath, options = {}) {
  return paced(async () => {
    for (let attempt = 0; ; attempt += 1) {
      let response;
      try {
        response = await fetch(
          `https://api.contentful.com/spaces/${config.spaceId}/environments/${config.environmentId}${urlPath}`,
          {
            ...options,
            headers: {
              Authorization: `Bearer ${config.accessToken}`,
              'Content-Type': 'application/vnd.contentful.management.v1+json',
              ...options.headers,
            },
          }
        );
      } catch (networkError) {
        // Transient DNS/connection blips, not Contentful errors - retry the same way.
        if (attempt < MAX_RETRIES) {
          await sleep(500 * 2 ** attempt);
          continue;
        }
        throw networkError;
      }

      const isRetryable = response.status === 429 || response.status >= 500;
      if (isRetryable && attempt < MAX_RETRIES) {
        const retryAfterHeader = response.headers.get('x-contentful-ratelimit-reset') || response.headers.get('retry-after');
        const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : NaN;
        const delayMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0
          ? retryAfterSeconds * 1000 + 100
          : 500 * 2 ** attempt;
        await sleep(delayMs);
        continue;
      }

      const body = await response.text();
      const data = body ? JSON.parse(body) : null;
      if (!response.ok) {
        const detail = data?.message || body || response.statusText;
        throw new Error(`Contentful request failed (${response.status}): ${detail}`);
      }
      return data;
    }
  });
}

async function createEntry(config, contentTypeId, fields) {
  return contentfulRequest(config, '/entries', {
    method: 'POST',
    headers: { 'X-Contentful-Content-Type': contentTypeId },
    body: JSON.stringify({ fields }),
  });
}

async function publishEntry(config, entry) {
  return contentfulRequest(config, `/entries/${entry.sys.id}/published`, {
    method: 'PUT',
    headers: { 'X-Contentful-Version': String(entry.sys.version) },
    body: JSON.stringify({}),
  });
}

app.post('/api/contentful/create-quiz-questions', async (req, res) => {
  try {
    const { quizId, questions, publish = true } = req.body || {};
    if (!isNonEmptyString(quizId)) return res.status(400).json({ error: 'quizId is required.' });

    const validationErrors = validateQuestions(questions);
    if (validationErrors.length) {
      return res.status(400).json({ error: 'Quiz JSON is invalid.', details: validationErrors });
    }

    const config = getContentfulConfig();
    let quiz = await contentfulRequest(config, `/entries/${quizId}`);
    if (quiz.sys?.contentType?.sys?.id !== 'quizComponent') {
      return res.status(400).json({ error: 'Open a Component - Quiz entry before importing questions.' });
    }

    const locale = Object.keys(quiz.fields?.title || {})[0] || defaultLocale;
    const existingQuestionLinks = quiz.fields?.questionEntries?.[locale] || [];
    if (!Array.isArray(existingQuestionLinks)) {
      return res.status(409).json({
        error: 'The quiz Questions reference field is not configured correctly. Run the content-model sync before importing.',
      });
    }

    const createdQuestionIds = [];
    let failure = null;

    for (const [questionIndex, question] of questions.entries()) {
      try {
        // A random suffix keeps the (unique) option `key` field collision-free across
        // re-runs and duplicate question text, so a retry after a transient failure
        // never trips the "key already exists" validation error.
        const optionEntries = await Promise.all(question.options.map((option, optionIndex) => {
          const optionLabel = `Option ${String.fromCharCode(65 + optionIndex)}`;
          return createEntry(config, 'quizOption', {
            key: { [locale]: `${question.questionText.trim()} — ${optionLabel} — ${shortId()}` },
            text: { [locale]: createRichText(option.text.trim()) },
          });
        }));

        const readyOptionEntries = publish
          ? await Promise.all(optionEntries.map((entry) => publishEntry(config, entry)))
          : optionEntries;

        const correctIndex = question.options.findIndex((option) => option.isCorrect);
        const questionEntry = await createEntry(config, 'questionComponent', {
          title: { [locale]: `Question ${existingQuestionLinks.length + createdQuestionIds.length + 1}: ${question.questionText.trim().slice(0, 80)}` },
          questionText: { [locale]: createRichText(question.questionText.trim()) },
          options: { [locale]: readyOptionEntries.map((entry) => createEntryLink(entry.sys.id)) },
          correctAnswer: { [locale]: createEntryLink(readyOptionEntries[correctIndex].sys.id) },
          explanation: { [locale]: createRichText(question.explanation.trim()) },
        });
        const readyQuestion = publish ? await publishEntry(config, questionEntry) : questionEntry;
        createdQuestionIds.push(readyQuestion.sys.id);

        // Attach to the quiz right away (draft only) so a later question failing
        // doesn't strand this one as an unlinked orphan entry.
        quiz = await contentfulRequest(config, `/entries/${quizId}`, {
          method: 'PUT',
          headers: { 'X-Contentful-Version': String(quiz.sys.version) },
          body: JSON.stringify({
            fields: {
              ...quiz.fields,
              questionEntries: {
                [locale]: [...existingQuestionLinks, ...createdQuestionIds.map(createEntryLink)],
              },
            },
          }),
        });
      } catch (error) {
        failure = {
          questionIndex,
          message: error instanceof Error ? error.message : 'Unknown error creating this question.',
        };
        break;
      }
    }

    let quizPublishError = null;
    if (publish && createdQuestionIds.length) {
      try {
        quiz = await publishEntry(config, quiz);
      } catch (error) {
        quizPublishError = error instanceof Error ? error.message : 'Unknown error publishing the quiz.';
      }
    }

    if (failure || quizPublishError) {
      const messages = [
        failure ? `Failed while creating question ${failure.questionIndex + 1} of ${questions.length}: ${failure.message}` : null,
        quizPublishError ? `Failed to publish the quiz after attaching questions: ${quizPublishError}` : null,
      ].filter(Boolean);

      return res.status(502).json({
        error: messages.join(' '),
        createdQuestionIds,
        hint: createdQuestionIds.length
          ? `The first ${createdQuestionIds.length} question(s) were created${quizPublishError ? ' and saved to the quiz in draft (quiz publish failed - open the quiz entry in Contentful and publish it manually, or re-run once the connection issue clears)' : ', attached, and published successfully'}. ${failure ? `Re-run the import with only the remaining question(s) from question ${failure.questionIndex + 1} onward.` : ''}`.trim()
          : 'No questions were created. Re-run the import.',
      });
    }

    return res.status(201).json({
      success: true,
      createdQuestionIds,
      published: publish,
      message: `Created, attached, and ${publish ? 'published' : 'saved'} ${createdQuestionIds.length} question(s).`,
    });
  } catch (error) {
    console.error('Error creating quiz questions:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown server error.' });
  }
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// In production this serves the custom-app UI and its API from one HTTPS origin.
// The Vite development server continues to proxy /api requests to this process.
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Contentful Quiz backend running on http://0.0.0.0:${port}`);
});
