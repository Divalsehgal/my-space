import { parseQuizPayload } from '@dival-sehgal/quiz/validate';
import { createQuizQuestions, type Signer } from './api/createQuizQuestions';

/** The blog's `quiz` reference field, as the App SDK exposes it. */
export interface QuizField {
  getValue: () => unknown;
  setValue: (value: unknown) => Promise<unknown>;
}

interface ImportOptions {
  entryId: string;
  /** Set on a Blog Page: questions go to its quiz, and a new quiz is linked to it. */
  quizField?: QuizField;
  json: string;
  publish: boolean;
  sign: Signer;
}

export const linkedQuizId = (field?: QuizField) => (field?.getValue() as { sys?: { id?: string } } | undefined)?.sys?.id;

/**
 * Validates the JSON, imports it, and links a newly created quiz to the blog
 * (the editor publishes the blog when ready). Resolves with the message to show.
 */
export async function importQuiz({ entryId, quizField, json, publish, sign }: ImportOptions): Promise<string> {
  const payload = parseQuizPayload(json);
  const result = await createQuizQuestions(quizField ? { blogId: entryId } : { quizId: entryId }, payload, publish, sign);
  const message = result.message || `Created ${payload.questions.length} question(s) successfully.`;
  if (!quizField || !result.quizId || linkedQuizId(quizField)) { return message; }
  await quizField.setValue({ sys: { type: 'Link', linkType: 'Entry', id: result.quizId } });
  return `${message} The new quiz is linked to this post. Publish the post to show it.`;
}
