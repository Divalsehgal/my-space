import { parseQuizPayload } from '@dival-sehgal/quiz/validate';
import { createQuizQuestions, type ImportTarget, type Signer } from './api/createQuizQuestions';

/**
 * Validates the JSON and imports it into the quiz, linking the blog to the
 * quiz on the server. Resolves with the message to show.
 */
export async function importQuiz(target: ImportTarget, json: string, publish: boolean, sign: Signer): Promise<string> {
  const payload = parseQuizPayload(json);
  const result = await createQuizQuestions(target, payload, publish, sign);
  const message = result.message || `Created ${payload.questions.length} question(s) successfully.`;
  return result.linkedBlog ? `${message} The blog now links to this quiz; publish the blog to show it.` : message;
}
