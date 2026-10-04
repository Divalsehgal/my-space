import { optionLetter } from '@dival-sehgal/quiz/validate';
import { contentfulRequest, createEntry, createEntryLink, createRichText, publishEntry, shortId } from './contentful.js';

/** Question titles in Contentful show this much of the question text. */
const TITLE_PREVIEW_CHARS = 80;

const errorMessage = (error, fallback) => (error instanceof Error ? error.message : fallback);

/** Creates (and optionally publishes) one question with its four option entries. */
async function createQuestion({ config, locale, publish }, question, number) {
  // A random suffix keeps the (unique) option `key` field collision-free across
  // re-runs and duplicate question text, so a retry never trips "key already exists".
  const optionEntries = await Promise.all(
    question.options.map((option, index) =>
      createEntry(config, 'quizOption', {
        key: { [locale]: `${question.questionText.trim()} — Option ${optionLetter(index)} — ${shortId()}` },
        text: { [locale]: createRichText(option.text.trim()) },
      }),
    ),
  );
  const options = publish ? await Promise.all(optionEntries.map((entry) => publishEntry(config, entry))) : optionEntries;
  const correctIndex = question.options.findIndex((option) => option.isCorrect);
  const entry = await createEntry(config, 'questionComponent', {
    title: { [locale]: `Question ${number}: ${question.questionText.trim().slice(0, TITLE_PREVIEW_CHARS)}` },
    questionText: { [locale]: createRichText(question.questionText.trim()) },
    options: { [locale]: options.map((option) => createEntryLink(option.sys.id)) },
    correctAnswer: { [locale]: createEntryLink(options[correctIndex].sys.id) },
    explanation: { [locale]: createRichText(question.explanation.trim()) },
  });
  return publish ? publishEntry(config, entry) : entry;
}

/** Saves the quiz (draft) with the given question links. */
const attachQuestions = (config, quiz, locale, links) =>
  contentfulRequest(config, `/entries/${quiz.sys.id}`, {
    method: 'PUT',
    headers: { 'X-Contentful-Version': String(quiz.sys.version) },
    body: JSON.stringify({ fields: { ...quiz.fields, questionEntries: { [locale]: links } } }),
  });

/**
 * Creates each question in order and attaches it to the quiz straight away, so
 * a later failure never strands earlier questions as unlinked orphans. Stops
 * at the first failure; publishes the quiz at the end when asked.
 */
export async function importQuestions({ config, quiz, locale, publish, questions }) {
  const existing = quiz.fields?.questionEntries?.[locale] || [];
  const createdQuestionIds = [];
  let current = quiz;
  let failure = null;

  for (const [questionIndex, question] of questions.entries()) {
    try {
      const created = await createQuestion({ config, locale, publish }, question, existing.length + createdQuestionIds.length + 1);
      createdQuestionIds.push(created.sys.id);
      current = await attachQuestions(config, current, locale, [...existing, ...createdQuestionIds.map(createEntryLink)]);
    } catch (error) {
      failure = { questionIndex, message: errorMessage(error, 'Unknown error creating this question.') };
      break;
    }
  }

  let quizPublishError = null;
  if (publish && createdQuestionIds.length) {
    try {
      await publishEntry(config, current);
    } catch (error) {
      quizPublishError = errorMessage(error, 'Unknown error publishing the quiz.');
    }
  }
  return { createdQuestionIds, failure, quizPublishError };
}
