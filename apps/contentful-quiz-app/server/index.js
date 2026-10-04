import express from 'express';
import dotenv from 'dotenv';
import path from 'node:path';
import { validateQuestions } from '@dival-sehgal/quiz/validate';
import { contentfulRequest, getContentfulConfig } from './contentful.js';
import { HTTP_STATUS } from './http.js';
import { importQuestions } from './importQuestions.js';
import { importResponse } from './responses.js';

const DEFAULT_PORT = 3003;
const serverDir = import.meta.dirname;

dotenv.config({ path: path.resolve(serverDir, '../.env') });

const app = express();
// Don't advertise the framework/version in an X-Powered-By header.
app.disable('x-powered-by');
const port = process.env.PORT || process.env.BACKEND_PORT || DEFAULT_PORT;
const defaultLocale = process.env.CONTENTFUL_LOCALE || 'en-US';
const distPath = path.resolve(serverDir, '../dist');

app.use(express.json({ limit: '2mb' }));

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

/** Loads the quiz entry and checks it can take new questions; returns an error reply instead when it can't. */
async function loadQuiz(config, quizId) {
  const quiz = await contentfulRequest(config, `/entries/${quizId}`);
  if (quiz.sys?.contentType?.sys?.id !== 'quizComponent') {
    return { error: { status: HTTP_STATUS.BAD_REQUEST, message: 'Open a Component - Quiz entry before importing questions.' } };
  }
  const locale = Object.keys(quiz.fields?.title || {})[0] || defaultLocale;
  if (!Array.isArray(quiz.fields?.questionEntries?.[locale] || [])) {
    return {
      error: {
        status: HTTP_STATUS.CONFLICT,
        message: 'The quiz Questions reference field is not configured correctly. Run the content-model sync before importing.',
      },
    };
  }
  return { quiz, locale };
}

app.post('/api/contentful/create-quiz-questions', async (req, res) => {
  try {
    const { quizId, questions, publish = true } = req.body || {};
    if (!isNonEmptyString(quizId)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'quizId is required.' });
    }
    const validationErrors = validateQuestions(questions);
    if (validationErrors.length) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Quiz JSON is invalid.', details: validationErrors });
    }

    const config = getContentfulConfig();
    const { quiz, locale, error } = await loadQuiz(config, quizId);
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    const result = await importQuestions({ config, quiz, locale, publish, questions });
    const { status, body } = importResponse(result, { total: questions.length, publish });
    return res.status(status).json(body);
  } catch (error) {
    console.error('Error creating quiz questions:', error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: error instanceof Error ? error.message : 'Unknown server error.' });
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
  console.info(`Contentful Quiz backend running on http://0.0.0.0:${port}`);
});
