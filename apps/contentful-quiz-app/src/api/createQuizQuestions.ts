import type { QuizPayload } from '@dival-sehgal/quiz/validate';
import { backendUrl } from './backendUrl';

const DEFAULT_ERROR = 'Failed to create quiz questions.';

/** The server's error message, whatever shape the failed response has. */
async function readError(response: Response): Promise<string> {
  try {
    if (response.headers.get('content-type')?.includes('application/json')) {
      const data = await response.json();
      return data?.error || data?.details?.[0] || DEFAULT_ERROR;
    }
    return await response.text();
  } catch {
    return `Server error: ${response.status} ${response.statusText}`;
  }
}

/**
 * Sends validated questions to the quiz server, which creates them in
 * Contentful and attaches them to the quiz. Resolves with the server's
 * success message; rejects with a readable error.
 */
export async function createQuizQuestions(quizId: string, payload: QuizPayload, publish: boolean): Promise<string | undefined> {
  const response = await fetch(`${backendUrl()}/contentful/create-quiz-questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quizId,
      questions: payload.questions.map(({ questionText, options, explanation }) => ({ questionText, options, explanation })),
      publish,
    }),
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  try {
    const data = await response.json();
    return data?.message;
  } catch {
    throw new Error('Invalid response from server. Please check backend logs.');
  }
}
