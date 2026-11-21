import type { QuizPayload } from '@dival-sehgal/quiz/validate';
import { signedPost, type Signer } from './signedPost';

export type { SignableRequest, Signer } from './signedPost';

/** Where the questions go: a quiz entry, or a blog post (its linked quiz, or a new one). */
export type ImportTarget = { quizId: string } | { blogId: string };

export interface ImportResult {
  message?: string;
  /** The quiz the questions were added to; new when the blog had none. */
  quizId?: string;
}

/**
 * Sends validated questions to the quiz API, which creates them in Contentful
 * and attaches them to the target's quiz.
 */
export function createQuizQuestions(target: ImportTarget, payload: QuizPayload, publish: boolean, sign: Signer): Promise<ImportResult> {
  return signedPost<ImportResult>(
    '/contentful/create-quiz-questions',
    {
      ...target,
      questions: payload.questions.map(({ questionText, options, explanation }) => ({ questionText, options, explanation })),
      publish,
    },
    sign,
    'Failed to create quiz questions.',
  );
}
