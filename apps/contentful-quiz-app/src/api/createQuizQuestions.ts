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

/** A request to sign; see Contentful's App SDK `cma.appSignedRequest.create`. */
export interface SignableRequest {
  method: 'POST';
  path: string;
  headers: Record<string, string>;
  body: string;
}

/** Returns the signature headers Contentful issues for a request from this app. */
export type Signer = (request: SignableRequest) => Promise<Record<string, string>>;

/**
 * Sends validated questions to the quiz API (a Vercel function in apps/web),
 * which creates them in Contentful and attaches them to the quiz. The request
 * is signed by Contentful so the API knows it comes from this installed app.
 * Resolves with the API's success message; rejects with a readable error.
 */
export async function createQuizQuestions(
  quizId: string,
  payload: QuizPayload,
  publish: boolean,
  sign: Signer,
): Promise<string | undefined> {
  const url = new URL(`${backendUrl()}/contentful/create-quiz-questions`, window.location.href);
  const headers = { 'Content-Type': 'application/json' };
  const body = JSON.stringify({
    quizId,
    questions: payload.questions.map(({ questionText, options, explanation }) => ({ questionText, options, explanation })),
    publish,
  });
  const signature = await sign({ method: 'POST', path: url.pathname, headers, body });
  const response = await fetch(url, { method: 'POST', headers: { ...headers, ...signature }, body });
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
