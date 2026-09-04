import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

async function contentfulRequest(config, urlPath, options = {}) {
  const response = await fetch(
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
  const body = await response.text();
  const data = body ? JSON.parse(body) : null;
  if (!response.ok) {
    const detail = data?.message || body || response.statusText;
    throw new Error(`Contentful request failed (${response.status}): ${detail}`);
  }
  return data;
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
    const quiz = await contentfulRequest(config, `/entries/${quizId}`);
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
    for (const [questionIndex, question] of questions.entries()) {
      const optionEntries = await Promise.all(question.options.map((option, optionIndex) =>
        {
          const optionLabel = `Option ${String.fromCharCode(65 + optionIndex)}`;
          return createEntry(config, 'quizOption', {
            key: { [locale]: `${question.questionText.trim()} — ${optionLabel}` },
            text: { [locale]: createRichText(option.text.trim()) },
          });
        }
      ));

      const readyOptionEntries = publish
        ? await Promise.all(optionEntries.map((entry) => publishEntry(config, entry)))
        : optionEntries;

      const correctIndex = question.options.findIndex((option) => option.isCorrect);
      const questionEntry = await createEntry(config, 'questionComponent', {
        title: { [locale]: `Question ${existingQuestionLinks.length + questionIndex + 1}: ${question.questionText.trim().slice(0, 80)}` },
        questionText: { [locale]: createRichText(question.questionText.trim()) },
        options: { [locale]: readyOptionEntries.map((entry) => createEntryLink(entry.sys.id)) },
        correctAnswer: { [locale]: createEntryLink(readyOptionEntries[correctIndex].sys.id) },
        explanation: { [locale]: createRichText(question.explanation.trim()) },
      });
      const readyQuestion = publish ? await publishEntry(config, questionEntry) : questionEntry;
      createdQuestionIds.push(readyQuestion.sys.id);
    }

    const updatedQuiz = await contentfulRequest(config, `/entries/${quizId}`, {
      method: 'PUT',
      headers: { 'X-Contentful-Version': String(quiz.sys.version) },
      body: JSON.stringify({
        fields: {
          ...quiz.fields,
          questionEntries: {
            [locale]: [
              ...existingQuestionLinks,
              ...createdQuestionIds.map(createEntryLink),
            ],
          },
        },
      }),
    });

    if (publish) await publishEntry(config, updatedQuiz);

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
