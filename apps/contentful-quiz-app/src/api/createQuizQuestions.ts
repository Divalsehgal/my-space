import type { QuizPayload } from '@dival-sehgal/quiz/validate';
import { signedPost, type Signer } from './signedPost';

export type { SignableRequest, Signer } from './signedPost';

/** The quiz the questions go into, and the blog to link it to. */
export interface ImportTarget {
  quizId: string;
  blogId?: string;
}

export interface ImportResult {
  message?: string;
  /** The blog's quiz field was just pointed at this quiz (as a draft). */
  linkedBlog?: boolean;
}

/**
 * Sends validated questions to the quiz API, which creates them in Contentful,
 * attaches them to the quiz and links the blog to it.
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
